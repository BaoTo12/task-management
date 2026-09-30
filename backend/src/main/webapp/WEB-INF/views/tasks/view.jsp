<%--
  One task. TaskViewServlet handled 400/404 and set "details" (a TaskDetails) and "pageTitle".
  S34 (34.09): EL only. S35: <c:out> for every piece of user text (its `default` replaces S34's `empty ? … : …`),
  and the comments section (35.18 Your Turn): an empty state, row numbers and zebra rows from varStatus,
  a label for comments written by admins. Comment bodies are stored as typed and escaped HERE (35.15).
  ${' '} before the badge: trimDirectiveWhitespaces deletes a plain leading space there (35.22).
--%>
<%@ page contentType="text/html;charset=UTF-8" pageEncoding="UTF-8" session="false" trimDirectiveWhitespaces="true" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib prefix="t" tagdir="/WEB-INF/tags" %>
<%@ taglib prefix="tf" uri="urn:taskflow:tags" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%@ include file="/WEB-INF/views/common/header.jspf" %>
    <nav class="text-muted"><a href="<c:url value='/tasks'/>"><fmt:message key="nav.tasks"/></a> › <c:out value="${details.task.title}"/></nav>
    <h1 class="page__title"><c:out value="${details.task.title}"/></h1>
    <p><t:statusBadge status="${details.task.status}"/>${' '}<span class="badge badge--priority-${fn:toLowerCase(details.task.priority)}"><fmt:message key="priority.${details.task.priority}"/></span></p>
    <c:choose>
      <c:when test="${empty details.task.description}"><p class="text-muted"><fmt:message key="view.noDescription"/></p></c:when>
      <c:otherwise><p class="task__description"><c:out value="${details.task.description}"/></p></c:otherwise>
    </c:choose>
    <dl>
      <dt><fmt:message key="view.category"/></dt><dd><c:choose><c:when test="${empty details.category}"><fmt:message key="form.noCategory"/></c:when><c:otherwise><c:out value="${details.category.name}"/></c:otherwise></c:choose></dd>
      <dt><fmt:message key="view.owner"/></dt><dd><c:out value="${details.owner.displayName}"/> (<c:out value="${details.owner.username}"/>)</dd>
      <dt><fmt:message key="view.due"/></dt><dd><c:choose><c:when test="${empty details.task.dueDate}"><fmt:message key="view.noDueDate"/></c:when><c:otherwise><tf:date value="${details.task.dueDate}"/></c:otherwise></c:choose></dd>
    </dl>

    <%-- S49 (49.12): the comments are a React ISLAND when it's built. The server-rendered section below stays inside
         #comments-root as the no-JavaScript fallback; React replaces it on mount. The island gets the task id from a data-
         attribute and the current user from the JSON block, both written by the SERVER (it can't be told another id). --%>
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
                  <%-- JSTL 1.2 formats java.util.Date only (44.13). An Instant prints as ISO text (2026-09-30T10:15:30.123Z):
                       fmt:parseDate turns that text into a Date (the pattern reads up to the seconds; the rest is ignored),
                       then fmt:formatDate prints it in the page's locale. Both inside fmt:timeZone: the text is UTC. --%>
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
        <input type="hidden" name="_csrf" value="${csrfToken}">
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

    <p>
      <a class="btn btn--secondary btn--sm" href="<c:url value='/tasks'/>"><fmt:message key="view.back"/></a>
      <a class="btn btn--secondary btn--sm" href="<c:url value='/tasks/edit?id=${details.task.id}'/>"><fmt:message key="view.edit"/></a>
      <form method="post" action="<c:url value='/tasks/delete'/>" class="inline-form" data-confirm-title="${fn:escapeXml(details.task.title)}">
        <input type="hidden" name="_csrf" value="${csrfToken}">
        <input type="hidden" name="id" value="${details.task.id}">
        <button class="btn btn--secondary btn--sm" type="submit"><fmt:message key="view.delete"/></button>
      </form>
    </p>
<%@ include file="/WEB-INF/views/common/footer.jspf" %>
