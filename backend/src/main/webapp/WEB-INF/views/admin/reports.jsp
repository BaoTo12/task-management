<%--
  Reports, server-rendered. ReportPageController set: report (ReportSummaryDto, @Value getters), projects,
  projectNames / userNames (id → name maps), maxPerDay. The React app draws the same data as charts (/api/reports/summary).
  The "chart" here is a <meter> per day: a bar without any inline style (the CSP forbids style="…").
  A GET form for the filters: the report is a READ, so its URL can be bookmarked and shared.
--%>
<%@ page contentType="text/html;charset=UTF-8" pageEncoding="UTF-8" session="false" trimDirectiveWhitespaces="true" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<%@ taglib prefix="t" tagdir="/WEB-INF/tags" %>
<%@ taglib prefix="tf" uri="urn:taskflow:tags" %>
<fmt:message key="page.reports" var="reportsTitle"/>
<t:layout title="${reportsTitle}">
    <h1 class="page__title">${reportsTitle}</h1>

    <form method="get" action="<c:url value='/admin/reports'/>" class="filters">
      <label><fmt:message key="reports.from"/> <input type="date" name="from" value="${report.from}"></label>
      <label><fmt:message key="reports.to"/> <input type="date" name="to" value="${report.to}"></label>
      <select name="projectId" aria-label="<fmt:message key='form.project'/>">
        <option value=""><fmt:message key="reports.allProjects"/></option>
        <c:forEach items="${projects}" var="project">
          <option value="${project.id}"${project.id == report.projectId ? ' selected' : ''}><c:out value="${project.name}"/></option>
        </c:forEach>
      </select>
      <button class="btn btn--sm btn--secondary" type="submit"><fmt:message key="tasks.apply"/></button>
    </form>

    <p class="stats">
      <span class="badge"><fmt:message key="reports.created"><fmt:param value="${report.totals.created}"/></fmt:message></span>
      <span class="badge badge--done"><fmt:message key="reports.completed"><fmt:param value="${report.totals.completed}"/></fmt:message></span>
      <span class="badge"><fmt:message key="reports.open"><fmt:param value="${report.totals.open}"/></fmt:message></span>
      <span class="badge badge--priority-high"><fmt:message key="reports.overdue"><fmt:param value="${report.totals.overdue}"/></fmt:message></span>
      <span class="badge"><fmt:message key="reports.tracked"><fmt:param value="${tf:minutes(report.trackedMinutes)}"/></fmt:message></span>
    </p>

    <h2><fmt:message key="reports.completedPerDay"/></h2>
    <table class="report__days">
      <tbody>
      <c:forEach items="${report.completedPerDay}" var="day">
        <tr>
          <td><fmt:formatNumber value="${day.date.dayOfMonth}"/>/<fmt:formatNumber value="${day.date.monthValue}"/></td>
          <td><meter min="0" max="${maxPerDay == 0 ? 1 : maxPerDay}" value="${day.count}">${day.count}</meter></td>
          <td>${day.count}</td>
        </tr>
      </c:forEach>
      </tbody>
    </table>

    <h2><fmt:message key="reports.byAssignee"/></h2>
    <table>
      <thead><tr><th><fmt:message key="view.assignee"/></th><th><fmt:message key="reports.col.total"/></th><th><fmt:message key="reports.col.done"/></th></tr></thead>
      <tbody>
      <c:forEach items="${report.byAssignee}" var="row">
        <tr>
          <td><c:choose><c:when test="${empty row.userId}"><fmt:message key="form.unassigned"/></c:when><c:otherwise><c:out value="${userNames[row.userId]}" default="#${row.userId}"/></c:otherwise></c:choose></td>
          <td>${row.total}</td>
          <td>${row.done}</td>
        </tr>
      </c:forEach>
      </tbody>
    </table>

    <h2><fmt:message key="reports.byProject"/></h2>
    <table>
      <thead><tr><th><fmt:message key="form.project"/></th><th><fmt:message key="reports.col.total"/></th><th><fmt:message key="reports.col.done"/></th></tr></thead>
      <tbody>
      <c:forEach items="${report.byProject}" var="row">
        <tr>
          <td><c:choose><c:when test="${empty row.projectId}"><fmt:message key="form.noProject"/></c:when><c:otherwise><c:out value="${projectNames[row.projectId]}" default="#${row.projectId}"/></c:otherwise></c:choose></td>
          <td>${row.total}</td>
          <td>${row.done}</td>
        </tr>
      </c:forEach>
      </tbody>
    </table>

    <h2><fmt:message key="reports.timeByUser"/></h2>
    <c:choose>
      <c:when test="${empty report.timeByUser}"><p class="text-muted"><fmt:message key="reports.noTime"/></p></c:when>
      <c:otherwise>
        <ul>
          <c:forEach items="${report.timeByUser}" var="row">
            <li><c:out value="${userNames[row.userId]}" default="#${row.userId}"/>: ${tf:minutes(row.minutes)}</li>
          </c:forEach>
        </ul>
      </c:otherwise>
    </c:choose>

    <%-- The same report, rendered by React (features/reports: the legacy classic-Redux module with its own store),
         when the islands are built. Server-rendered tables above, an interactive version below. --%>
    <c:if test="${not empty reportsIsland}">
      <h2><fmt:message key="reports.interactive"/></h2>
      <div id="reports-root" class="island"></div>
      <c:forEach items="${reportsIsland.styles}" var="css"><link rel="stylesheet" href="<c:url value='${css}'/>"></c:forEach>
      <script type="module" nonce="${cspNonce}" src="<c:url value='${reportsIsland.script}'/>"></script>
    </c:if>
</t:layout>
