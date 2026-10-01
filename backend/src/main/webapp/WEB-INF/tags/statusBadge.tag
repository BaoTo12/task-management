<%--
  S44 (44.11): <t:statusBadge status="${task.status}"/> → the coloured, translated status badge (one place for the
  three cases that task-row.jspf used to spell out). A typed attribute: EL passes the TaskStatus enum itself.
--%>
<%@ tag description="A task status as a badge" pageEncoding="UTF-8" trimDirectiveWhitespaces="true" %>
<%@ attribute name="status" required="true" type="com.taskflow.entity.TaskStatus" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<c:choose>
  <c:when test="${status == 'DONE'}"><span class="badge badge--done"><fmt:message key="status.DONE"/></span></c:when>
  <c:when test="${status == 'IN_PROGRESS'}"><span class="badge badge--progress"><fmt:message key="status.IN_PROGRESS"/></span></c:when>
  <c:otherwise><span class="badge"><fmt:message key="status.TODO"/></span></c:otherwise>
</c:choose>