package com.taskflow.web.support;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletContext;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Where the built React island files are. `npm run build:island` (frontend) writes hashed files such as
 * static/island/assets/boardIsland-3f9a1c.js plus .vite/manifest.json, which maps each ENTRY to its current file names.
 * JSPs ask this class instead of hard-coding a hash that changes with every build.
 *   manifest["src/island/boardIsland.tsx"] = {"file":"assets/boardIsland-….js","css":["assets/…css"],"imports":[…]}
 * Read on every call while developing (the build may change under a running server); cheap: a small JSON file.
 * The ServletContext is injected like any bean: Spring Boot registers it.
 */
@Component
@RequiredArgsConstructor
public class IslandAssets {

  public static final String BASE = "/static/island/";
  private static final String MANIFEST = BASE + ".vite/manifest.json";

  /** An entry's script and stylesheets, as context-relative paths (the JSP puts them through <c:url>). */
  @Getter
  @RequiredArgsConstructor
  public static class Entry {
    private final String script;
    private final List<String> styles;
  }

  private final ServletContext context;
  private final ObjectMapper mapper;

  /** The built files of this entry, or null when the island hasn't been built (the page shows a hint instead). */
  public Entry entry(String entryName) {
    try (InputStream in = context.getResourceAsStream(MANIFEST)) {
      if (in == null) return null;
      JsonNode chunk = mapper.readTree(in).get(entryName);
      if (chunk == null) return null;
      List<String> styles = new ArrayList<>();
      if (chunk.has("css")) chunk.get("css").forEach(css -> styles.add(BASE + css.asText()));
      return new Entry(BASE + chunk.get("file").asText(), styles);
    } catch (IOException e) {
      throw new IllegalStateException("Unreadable island manifest " + MANIFEST, e);
    }
  }
}
