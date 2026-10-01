package com.taskflow.dto.response;

import com.taskflow.entity.User;

/** Anyone else, as the people picker and avatars need them (normalised by the SPA into a users entity adapter). */
public record UserSummaryDto(long id, String username, String displayName) {

  public static UserSummaryDto from(User u) {
    return new UserSummaryDto(u.getId(), u.getUsername(), u.getDisplayName());
  }
}
