package com.taskflow.dto.response;

import java.util.List;

/**
 * A CURSOR page: {"items":[…],"nextCursor":118,"unreadCount":3}. nextCursor is the id to pass as ?before= for the next
 * (older) page; null when there is nothing older. unreadCount is only filled for the inbox.
 * (The SPA reads it with an RTK Query infinite query: pageParam = nextCursor.)
 */
public record CursorPageDto<T>(List<T> items, Long nextCursor, Long unreadCount) {}
