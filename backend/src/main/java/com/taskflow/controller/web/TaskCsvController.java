package com.taskflow.controller.web;

import com.taskflow.config.TaskflowProperties;
import com.taskflow.entity.Priority;
import com.taskflow.entity.Task;
import com.taskflow.exception.DuplicateException;
import com.taskflow.repository.criteria.TaskQuery;
import com.taskflow.security.AuthUser;
import com.taskflow.service.TaskService;
import com.taskflow.web.support.CsvLines;
import com.taskflow.web.support.Messages;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

/**
 * CSV in and out.
 *
 * GET /tasks/export.csv: Spring MVC ASYNC with StreamingResponseBody. The controller returns at once; Spring runs the
 * lambda on its task executor (not on Tomcat's request thread) and writes straight into the response. The servlet
 * era did the same by hand with request.startAsync(), an ExecutorService and an AsyncListener.
 * The data is read BEFORE returning (on the request thread): the lambda runs outside the request's security context
 * and transaction. 🛡 CSV injection: a cell starting with = + - @ is a FORMULA in Excel/Sheets: prefixed with '.
 *
 * POST /tasks/import: a multipart upload (MultipartFile). The limits are in application.yml
 * (spring.servlet.multipart.*): a bigger upload is refused before this code runs (413). Every row gets the same checks
 * as a typed form. The owner comes from the session, never from the file.
 */
@Slf4j
@Controller
@RequestMapping("/tasks")
@RequiredArgsConstructor
public class TaskCsvController {

  private final TaskService tasks;
  private final Messages messages;
  private final TaskflowProperties properties;

  @GetMapping("/export.csv")
  ResponseEntity<StreamingResponseBody> export(@AuthenticationPrincipal AuthUser user) {
    List<Task> rows = tasks.find(TaskQuery.all(), user);          // now, on the request thread
    StreamingResponseBody body = out -> {
      Writer writer = new OutputStreamWriter(out, StandardCharsets.UTF_8);
      writer.write("id,title,status,priority,due_date\r\n");      // RFC 4180: CRLF line ends
      for (Task task : rows) {
        writer.write(task.getId() + "," + CsvLines.cell(task.getTitle()) + "," + task.getStatus() + ","
            + task.getPriority() + "," + (task.getDueDate() == null ? "" : task.getDueDate()) + "\r\n");
      }
      writer.flush();
      log.info("CSV export of {} tasks for user {}", rows.size(), user.getId());
    };
    return ResponseEntity.ok()
        .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"tasks.csv\"")
        .body(body);
  }

  /** Format: a header line, then title,description,priority,due_date. */
  @PostMapping("/import")
  String importCsv(@RequestParam("file") MultipartFile file, @AuthenticationPrincipal AuthUser user,
                   RedirectAttributes redirect) throws IOException {
    if (file.isEmpty()) {
      redirect.addFlashAttribute("flash", messages.get("import.empty"));
      return "redirect:/tasks";
    }
    int maxRows = properties.csvImport().maxRows();
    int created = 0;
    List<String> problems = new ArrayList<>();
    try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
      reader.readLine();                                          // the header line
      String line;
      int lineNumber = 1;
      while ((line = reader.readLine()) != null) {
        lineNumber++;
        if (line.isBlank()) continue;
        if (lineNumber - 1 > maxRows) {
          problems.add(messages.get("import.tooMany", maxRows));
          break;
        }
        List<String> cells = CsvLines.parse(line);
        String error = rowError(cells);
        if (error != null) {
          problems.add(messages.get("import.rowError", lineNumber, error.split(":")[0], error.split(":")[1].strip()));
          continue;
        }
        try {
          tasks.create(toTask(cells), user);
          created++;
        } catch (DuplicateException e) {
          problems.add(messages.get("import.duplicate", lineNumber, CsvLines.get(cells, 0).strip()));
        }
      }
    }
    redirect.addFlashAttribute("flash", problems.isEmpty()
        ? messages.get("import.done", created)
        : messages.get("import.partly", created, problems.size(), String.join(" · ", problems.subList(0, Math.min(3, problems.size())))));
    return "redirect:/tasks";
  }

  /** "field: message" for the first problem of a row, or null. */
  private static String rowError(List<String> cells) {
    String title = CsvLines.get(cells, 0).strip();
    if (title.isEmpty()) return "title: must not be blank";
    if (title.length() > 120) return "title: size must be at most 120";
    if (CsvLines.get(cells, 1).length() > 2000) return "description: size must be at most 2000";
    if (Priority.parse(CsvLines.get(cells, 2).strip().toUpperCase(Locale.ROOT)) == null) {
      return "priority: must be one of LOW, MEDIUM, HIGH";
    }
    String due = CsvLines.get(cells, 3).strip();
    if (!due.isEmpty()) {
      try {
        LocalDate.parse(due);
      } catch (DateTimeParseException e) {
        return "dueDate: must be a date (YYYY-MM-DD)";
      }
    }
    return null;
  }

  private static Task toTask(List<String> cells) {
    Task task = new Task();
    task.setTitle(CsvLines.get(cells, 0).strip());
    task.setDescription(CsvLines.get(cells, 1).strip());
    task.setPriority(Priority.parse(CsvLines.get(cells, 2).strip().toUpperCase(Locale.ROOT)));
    String due = CsvLines.get(cells, 3).strip();
    task.setDueDate(due.isEmpty() ? null : LocalDate.parse(due));
    return task;
  }
}
