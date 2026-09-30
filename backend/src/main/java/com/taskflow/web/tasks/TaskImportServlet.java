package com.taskflow.web.tasks;

import com.taskflow.dao.DuplicateKeyException;
import com.taskflow.model.Task;
import com.taskflow.service.TaskService;
import com.taskflow.web.AppContextListener;
import com.taskflow.web.CurrentUser;
import com.taskflow.web.Flash;
import com.taskflow.web.Http;
import com.taskflow.web.Messages;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import javax.servlet.ServletException;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.Part;

/**
 * S45 (45.A, file upload): POST /tasks/import, a CSV file → tasks. The twin of the CSV export (TaskExportServlet).
 *
 * - {@code @MultipartConfig}: without it, a multipart/form-data body is NOT parsed and getPart() throws. The limits are
 *   part of the security design: a request over maxRequestSize is rejected by the container before our code runs
 *   (IllegalStateException → 413 via the error pages), so nobody can make the server buffer 2 GB.
 * - fileSizeThreshold: parts smaller than this stay in memory; bigger ones go to a temporary file.
 * - Part: one field of the form. getSubmittedFileName() is USER INPUT (it's only shown, never used as a path).
 * - The CSRF filter still works: with @MultipartConfig on the target servlet, Tomcat parses the multipart parameters
 *   when a filter first calls getParameter("_csrf").
 *
 * Format: a header line, then title,description,priority,due_date (the export's columns in the same spirit).
 * Every row goes through TaskForm.validate(): an imported task is checked exactly like a typed one.
 */
@WebServlet("/tasks/import")
@MultipartConfig(fileSizeThreshold = 64 * 1024, maxFileSize = 512 * 1024, maxRequestSize = 1024 * 1024)
public class TaskImportServlet extends HttpServlet {

  /** More rows than this is a bulk migration, not an import from the UI. */
  static final int MAX_ROWS = 500;

  private TaskService service;

  @Override
  public void init() {
    service = AppContextListener.taskService(getServletContext());
  }

  @Override
  protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
    Part file = request.getPart("file");
    if (file == null || file.getSize() == 0) {
      Flash.put(request, Messages.get(request, "import.empty"));
      Http.seeOther(response, request.getContextPath() + "/tasks");
      return;
    }

    long ownerId = CurrentUser.get(request).getId(); // the owner comes from the SESSION, never from the file (37.11)
    int created = 0;
    List<String> problems = new ArrayList<>();
    try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
      reader.readLine(); // the header line
      String line;
      int lineNumber = 1;
      while ((line = reader.readLine()) != null) {
        lineNumber++;
        if (line.isBlank()) continue;
        if (lineNumber - 1 > MAX_ROWS) {
          problems.add(Messages.get(request, "import.tooMany", MAX_ROWS));
          break;
        }
        List<String> cells = parseCsvLine(line);
        TaskForm form = TaskForm.of(cell(cells, 0), cell(cells, 1), cell(cells, 2), cell(cells, 3));
        Map<String, String> errors = form.validate(service.categoryIds());
        if (!errors.isEmpty()) {
          problems.add(Messages.get(request, "import.rowError", lineNumber, errors.keySet().iterator().next(),
              errors.values().iterator().next()));
          continue;
        }
        Task task = new Task();
        form.applyTo(task);
        task.setOwnerId(ownerId);
        try {
          service.create(task);
          created++;
        } catch (DuplicateKeyException e) {
          problems.add(Messages.get(request, "import.duplicate", lineNumber, task.getTitle()));
        }
      }
    }

    Flash.put(request, problems.isEmpty()
        ? Messages.get(request, "import.done", created)
        : Messages.get(request, "import.partly", created, problems.size(), String.join(" · ", problems.subList(0, Math.min(3, problems.size())))));
    Http.seeOther(response, request.getContextPath() + "/tasks"); // PRG (37.10), like every other form
  }

  private static String cell(List<String> cells, int index) {
    return index < cells.size() ? cells.get(index) : "";
  }

  /** One RFC 4180 line: commas separate cells, a quoted cell may contain commas and "" for a quote. */
  static List<String> parseCsvLine(String line) {
    List<String> cells = new ArrayList<>();
    StringBuilder current = new StringBuilder();
    boolean quoted = false;
    for (int i = 0; i < line.length(); i++) {
      char c = line.charAt(i);
      if (quoted) {
        if (c == '"' && i + 1 < line.length() && line.charAt(i + 1) == '"') {
          current.append('"');
          i++;
        } else if (c == '"') {
          quoted = false;
        } else {
          current.append(c);
        }
      } else if (c == '"') {
        quoted = true;
      } else if (c == ',') {
        cells.add(current.toString());
        current.setLength(0);
      } else {
        current.append(c);
      }
    }
    cells.add(current.toString());
    return cells;
  }
}
