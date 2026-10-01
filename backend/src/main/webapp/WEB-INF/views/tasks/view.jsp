<%--
  One task. TaskPageController.view set "details" (a TaskDetails view model), "pageTitle" and "today".
  EL + JSTL only: <c:out> for every piece of user text. Comment bodies are stored as typed and escaped HERE.
  ${' '} before a badge: trimDirectiveWhitespaces deletes a plain leading space there.
  The checklist, labels and tracked time are read-only here: the React app edits them (the Admin Portal shows them).
--%>
<%@ page contentType="text/html;charset=UTF-8" pageEncoding="UTF-8" session="false" trimDirectiveWhitespaces="true" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fn" uri="jakarta.tags.functions" %>
<%@ taglib prefix="t" tagdir="/WEB-INF/tags" %>
<%@ taglib prefix="tf" uri="urn:taskflow:tags" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<%@ include file="/WEB-INF/views/common/header.jspf" %>
    <nav class="text-muted"><a href="<c:url value='/tasks'/>"><fmt:message key="nav.tasks"/></a> › <c:out value="${details.task.title}"/></nav>
    <h1 class="page__title"><c:out value="${details.task.title}"/></h1>
    <p>
      <t:statusBadge status="${details.task.status}"/>${' '}<span class="badge badge--priority-${fn:toLowerCase(details.task.priority)}"><fmt:message key="priority.${details.task.priority}"/></span>
      <c:forEach items="${details.labels}" var="label">${' '}<span class="badge label" data-color="${fn:escapeXml(label.color)}"><c:out value="${label.name}"/></span></c:forEach>
    </p>
    <c:choose>
      <c:when test="${empty details.task.description}"><p class="text-muted"><fmt:message key="view.noDescription"/></p></c:when>
      <c:otherwise><p class="task__description"><c:out value="${details.task.description}"/></p></c:otherwise>
    </c:choose>
    <dl>
      <dt><fmt:message key="view.category"/></dt><dd><c:choose><c:when test="${empty details.category}"><fmt:message key="form.noCategory"/></c:when><c:otherwise><c:out value="${details.category.name}"/></c:otherwise></c:choose></dd>
      <dt><fmt:message key="view.project"/></dt><dd><c:choose><c:when test="${empty details.project}"><fmt:message key="form.noProject"/></c:when><c:otherwise><c:out value="${details.project.name}"/></c:otherwise></c:choose></dd>
      <dt><fmt:message key="view.owner"/></dt><dd><c:out value="${details.owner.displayName}"/> (<c:out value="${details.owner.username}"/>)</dd>
      <dt><fmt:message key="view.assignee"/></dt><dd><c:out value="${details.assignee.displayName}" default="—"/></dd>
      <dt><fmt:message key="view.due"/></dt><dd><c:choose><c:when test="${empty details.task.dueDate}"><fmt:message key="view.noDueDate"/></c:when><c:otherwise><tf:date value="${details.task.dueDate}"/></c:otherwise></c:choose></dd>
      <dt><fmt:message key="view.tracked"/></dt><dd>${tf:minutes(details.trackedMinutes)}</dd>
    </dl>

    <%-- The checklist: varStatus gives the position; a done item is struck through by the CSS class. --%>
    <c:if test="${not empty details.subtasks}">
      <section class="checklist">
        <h2><fmt:message key="view.checklist"><fmt:param value="${details.subtasksDone}"/><fmt:param value="${fn:length(details.subtasks)}"/></fmt:message></h2>
        <ul>
          <c:forEach items="${details.subtasks}" var="subtask">
            <li class="${subtask.done ? 'checklist__item--done' : ''}">${subtask.done ? '☑' : '☐'} <c:out value="${subtask.title}"/></li>
          </c:forEach>
        </ul>
      </section>
    </c:if>

    <%-- The comments are a React ISLAND when it's built. The server-rendered section below stays inside #comments-root
         as the no-JavaScript fallback; React replaces it on mount. The island gets the task id from a data- attribute
         and the current user from the JSON block, both written by the SERVER. --%>
    <c:if test="${not empty commentsIsland}">
      <script type="application/json" id="comments-data">${commentsInitialJson}</script>
    </c:if>
    <div id="comments-root" data-task-id="${details.task.id}">
    <section id="comments">
      <h2><fmt:message key="view.comments"><fmt:param value="${fn:length(details.comments)}"/></fmt:message></h2>
      <c:choose>
        <c:when test="${empty details.comments}">
          <p class="text-muted"><fmt:message key="view.noComments"/></p>
        </c:when>
        <c:otherwise>
          <table class="comments">
            <tbody>
            <c:forEach items="${details.comments}" var="item" varStatus="row">
              <tr class="${row.count % 2 == 0 ? 'comment--even' : 'comment--odd'}">
                <td class="row-number">#${row.count}</td>
                <td class="comment__author"><c:choose><c:when test="${empty item.author}"><fmt:message key="view.deletedUser"/></c:when><c:otherwise><c:out value="${item.author.displayName}"/></c:otherwise></c:choose><c:if test="${item.author.admin}">${' '}<span class="badge"><fmt:message key="view.admin"/></span></c:if></td>
                <td class="comment__body"><c:out value="${item.comment.body}"/></td>
                <td class="text-muted">
                  <%-- JSTL formats java.util.Date only. An Instant prints as ISO text (2026-09-30T10:15:30Z):
                       fmt:parseDate turns that text into a Date, then fmt:formatDate prints it in the page's locale.
                       Both inside fmt:timeZone: the text is UTC. --%>
                  <fmt:timeZone value="UTC">
                    <fmt:parseDate value="${item.comment.createdAt}" pattern="yyyy-MM-dd'T'HH:mm:ss" var="commentedAt"/>
                    <fmt:formatDate value="${commentedAt}" type="both" dateStyle="medium" timeStyle="short"/> UTC
                  </fmt:timeZone>
                </td>
              </tr>
            </c:forEach>
            </tbody>
          </table>
        </c:otherwise>
      </c:choose>
      <form method="post" action="<c:url value='/tasks/comment'/>">
        <input type="hidden" name="${_csrf.parameterName}" value="${_csrf.token}">
        <input type="hidden" name="id" value="${details.task.id}">
        <textarea name="body" rows="3" maxlength="1000" required></textarea>
        <button class="btn btn--sm" type="submit"><fmt:message key="view.addComment"/></button>
      </form>
    </section>
    </div>
    <c:if test="${not empty commentsIsland}">
      <c:forEach items="${commentsIsland.styles}" var="css"><link rel="stylesheet" href="<c:url value='${css}'/>"></c:forEach>
      <script type="module" nonce="${cspNonce}" src="<c:url value='${commentsIsland.script}'/>"></script>
    </c:if>

    <%-- Buttons only for what this user may do (details.canEdit / canDelete); the services check again on POST. --%>
    <p>
      <a class="btn btn--secondary btn--sm" href="<c:url value='/tasks'/>"><fmt:message key="view.back"/></a>
      <c:if test="${details.canEdit}">
        <a class="btn btn--secondary btn--sm" href="<c:url value='/tasks/edit?id=${details.task.id}'/>"><fmt:message key="view.edit"/></a>
      </c:if>
      <c:if test="${details.canDelete}">
        <form method="post" action="<c:url value='/tasks/delete'/>" class="inline-form" data-confirm-title="${fn:escapeXml(details.task.title)}">
          <input type="hidden" name="${_csrf.parameterName}" value="${_csrf.token}">
          <input type="hidden" name="id" value="${details.task.id}">
          <button class="btn btn--secondary btn--sm" type="submit"><fmt:message key="view.delete"/></button>
        </form>
      </c:if>
    </p>
<%@ include file="/WEB-INF/views/common/footer.jspf" %>
