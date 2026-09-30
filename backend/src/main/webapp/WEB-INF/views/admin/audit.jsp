<%--
  S45 (45.10): the audit log. AdminAuditServlet set: auditPage (Page<AuditDao.Event>), types, typeFilter,
  loggedInUsers, loggedInSessions, activeSessions. Every value from the log is escaped: usernames of FAILED logins
  are whatever someone typed into the login form (36.10).
--%>
<%@ page contentType="text/html;charset=UTF-8" pageEncoding="UTF-8" session="false" trimDirectiveWhitespaces="true" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%@ taglib prefix="t" tagdir="/WEB-INF/tags" %>
<fmt:message key="page.audit" var="auditTitle"/>
<t:layout title="${auditTitle}">
    <h1 class="page__title">${auditTitle}</h1>

    <p class="audit__sessions"><fmt:message key="audit.loggedInNow"><fmt:param value="${loggedInSessions}"/></fmt:message>
      <c:forEach items="${loggedInUsers}" var="name" varStatus="s"><c:out value="${name}"/>${s.last ? '' : ', '}</c:forEach>
      · <fmt:message key="audit.allSessions"><fmt:param value="${activeSessions}"/></fmt:message>
    </p>

    <form method="get" action="<c:url value='/admin/audit'/>" class="filters">
      <select name="type" aria-label="<fmt:message key='audit.eventType'/>">
        <option value=""><fmt:message key="audit.allEvents"/></option>
        <c:forEach items="${types}" var="type">
          <option value="${type}"${type == typeFilter ? ' selected' : ''}>${type}</option>
        </c:forEach>
      </select>
      <input type="search" name="user" maxlength="50" value="${fn:escapeXml(param.user)}" placeholder="<fmt:message key='audit.username'/>" aria-label="<fmt:message key='audit.username'/>">
      <button class="btn btn--sm btn--secondary" type="submit"><fmt:message key="audit.filter"/></button>
    </form>

    <c:choose>
      <c:when test="${empty auditPage.items}"><p class="text-muted"><fmt:message key="audit.empty"/></p></c:when>
      <c:otherwise>
        <table class="audit">
          <thead><tr><th><fmt:message key="audit.col.when"/> (UTC)</th><th><fmt:message key="audit.col.event"/></th><th><fmt:message key="audit.col.user"/></th><th><fmt:message key="audit.col.ip"/></th><th><fmt:message key="audit.col.details"/></th></tr></thead>
          <tbody>
          <c:forEach items="${auditPage.items}" var="event">
            <tr>
              <td>
                <%-- LocalDateTime (UTC in the database) → text → Date → formatted in the page's locale (44.13) --%>
                <fmt:timeZone value="UTC">
                  <fmt:parseDate value="${event.at}" pattern="yyyy-MM-dd'T'HH:mm" var="eventAt"/>
                  <fmt:formatDate value="${eventAt}" type="both" dateStyle="short" timeStyle="medium"/>
                </fmt:timeZone>
              </td>
              <td>${event.type}</td>
              <td><c:out value="${event.username}" default="—"/></td>
              <td><c:out value="${event.ip}"/></td>
              <td><c:out value="${event.details}"/></td>
            </tr>
          </c:forEach>
          </tbody>
        </table>
        <t:pagination of="${auditPage}" path="/admin/audit" keep="type,user"/>
      </c:otherwise>
    </c:choose>
</t:layout>
