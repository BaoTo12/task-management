<%--
  S39 (39.10): the dashboard: overdue tasks and tasks due in the next 7 days. DashboardServlet set overdue, dueSoon,
  today and csrfToken. Both tables reuse task-row.jspf (the same fragment as the list), included twice in one page.
  S44: the layout tag and the bundle's texts, like the list.
--%>
<%@ page contentType="text/html;charset=UTF-8" pageEncoding="UTF-8" session="false" trimDirectiveWhitespaces="true" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%@ taglib prefix="t" tagdir="/WEB-INF/tags" %>
<fmt:message key="dashboard.title" var="dashboardTitle"/>
<t:layout title="${dashboardTitle}">
    <h1 class="page__title">${dashboardTitle}</h1>

    <%-- An optional site-wide announcement, edited by operations WITHOUT a redeploy: static/notice.html.
         <c:import> (35.A) fetches a URL at request time (here a file of this web app, via the default servlet) into a
         variable. When the file doesn't exist the import FAILS (404), and <c:catch> turns that into "no notice" instead of
         an error page. The file is trusted content deployed with the server, so it is printed as HTML. --%>
    <c:catch var="noticeMissing">
      <c:import url="/static/notice.html" var="notice" charEncoding="UTF-8"/>
    </c:catch>
    <c:if test="${empty noticeMissing and not empty notice}">
      <aside class="flash" role="note" aria-label="<fmt:message key='dashboard.notice'/>">${notice}</aside>
    </c:if>

    <%-- fmt:formatNumber type="percent" (44.10): 0.4166 → "42%" in English, "42 %" in Vietnamese. --%>
    <fmt:formatNumber value="${completion}" type="percent" var="completionText"/>
    <p class="dashboard__completion">
      <fmt:message key="dashboard.completion"><fmt:param value="${completionText}"/></fmt:message>
    </p>
    <%-- <c:forTokens> (35.A): a loop over a fixed, comma-separated list written IN the view: the statuses in board order. --%>
    <p class="dashboard__counts">
      <c:forTokens items="TODO,IN_PROGRESS,DONE" delims="," var="status" varStatus="s">
        <t:statusBadge status="${status}"/> <fmt:formatNumber value="${counts[status] + 0}"/>${s.last ? '' : ' · '}
      </c:forTokens>
    </p>

    <h2><fmt:message key="dashboard.overdue"><fmt:param value="${fn:length(overdue)}"/></fmt:message></h2>
    <c:choose>
      <c:when test="${empty overdue}"><p class="text-muted"><fmt:message key="dashboard.nothingOverdue"/></p></c:when>
      <c:otherwise>
        <table class="dashboard__overdue">
          <thead><tr><th>#</th><th><fmt:message key="tasks.col.title"/></th><th><fmt:message key="tasks.col.status"/></th><th><fmt:message key="tasks.col.priority"/></th><th><fmt:message key="tasks.col.due"/></th><th></th></tr></thead>
          <tbody>
          <c:forEach items="${overdue}" var="task" varStatus="row">
            <%@ include file="/WEB-INF/views/tasks/task-row.jspf" %>
          </c:forEach>
          </tbody>
        </table>
      </c:otherwise>
    </c:choose>

    <h2><fmt:message key="dashboard.dueSoon"><fmt:param value="${fn:length(dueSoon)}"/></fmt:message></h2>
    <c:choose>
      <c:when test="${empty dueSoon}"><p class="text-muted"><fmt:message key="dashboard.nothingDueSoon"/></p></c:when>
      <c:otherwise>
        <table class="dashboard__due-soon">
          <thead><tr><th>#</th><th><fmt:message key="tasks.col.title"/></th><th><fmt:message key="tasks.col.status"/></th><th><fmt:message key="tasks.col.priority"/></th><th><fmt:message key="tasks.col.due"/></th><th></th></tr></thead>
          <tbody>
          <c:forEach items="${dueSoon}" var="task" varStatus="row">
            <%@ include file="/WEB-INF/views/tasks/task-row.jspf" %>
          </c:forEach>
          </tbody>
        </table>
      </c:otherwise>
    </c:choose>
</t:layout>