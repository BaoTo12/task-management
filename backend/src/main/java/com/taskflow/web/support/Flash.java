package com.taskflow.web.support;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Map;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.FlashMap;
import org.springframework.web.servlet.FlashMapManager;
import org.springframework.web.servlet.support.SessionFlashMapManager;

/**
 * A message that survives ONE redirect ("Task created"), for code that runs OUTSIDE a controller (the login handlers,
 * AccountStateFilter). Controllers use RedirectAttributes.addFlashAttribute("flash", …) instead; both end up in the
 * same place: Spring's FlashMap in the session, moved into the NEXT request's model, then removed. Views read ${flash}.
 * (The servlet era wrote this mechanism by hand: S37's Flash.put/consume.)
 */
@Component
public class Flash {

  public static final String ATTRIBUTE = "flash";

  private final FlashMapManager manager = new SessionFlashMapManager();  // the same storage DispatcherServlet uses

  /** ONE FlashMap per redirect: the next request receives exactly one of the saved maps, so put everything in it. */
  public void put(HttpServletRequest request, HttpServletResponse response, Map<String, ?> attributes) {
    FlashMap flash = new FlashMap();
    flash.putAll(attributes);
    manager.saveOutputFlashMap(flash, request, response);
  }

  public void message(HttpServletRequest request, HttpServletResponse response, String message) {
    put(request, response, Map.of(ATTRIBUTE, message));
  }
}
