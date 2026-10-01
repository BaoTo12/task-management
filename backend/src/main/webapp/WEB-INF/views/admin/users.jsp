<%--
  S42 (42.07): user management. AdminUsersController set: accounts (User entities), roles. Each form carries ${_csrf.token}.
  The admin's own row has no forms: the service refuses self-changes anyway (defence in depth, 42.06).
--%>
<%@ page contentType="text/html;charset=UTF-8" pageEncoding="UTF-8" session="false" trimDirectiveWhitespaces="true" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fn" uri="jakarta.tags.functions" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<%@ include file="/WEB-INF/views/common/header.jspf" %>
    <h1 class="page__title"><fmt:message key="page.users"/></h1>

    <table class="users">
      <thead><tr><th><fmt:message key="users.col.user"/></th><th><fmt:message key="users.col.email"/></th><th><fmt:message key="users.col.role"/></th><th><fmt:message key="users.col.status"/></th></tr></thead>
      <tbody>
      <c:forEach items="${accounts}" var="account">
        <tr class="${account.enabled ? '' : 'is-disabled'}">
          <td><c:out value="${account.displayName}"/> (<c:out value="${account.username}"/>)</td>
          <td><c:out value="${account.email}"/></td>
          <c:choose>
            <c:when test="${account.id == currentUser.id}">
              <td>${account.role}</td>
              <td><fmt:message key="users.enabledYou"/></td>
            </c:when>
            <c:otherwise>
              <td>
                <form method="post" action="<c:url value='/admin/users/role'/>" class="inline-form">
                  <input type="hidden" name="_csrf" value="${_csrf.token}">
                  <input type="hidden" name="id" value="${account.id}">
                  <fmt:message key="users.roleOf" var="roleLabel"><fmt:param value="${account.username}"/></fmt:message>
                  <select name="role" aria-label="${fn:escapeXml(roleLabel)}">
                    <c:forEach items="${roles}" var="role">
                      <option value="${role}"${role == account.role ? ' selected' : ''}>${role}</option>
                    </c:forEach>
                  </select>
                  <button class="btn btn--sm btn--secondary" type="submit"><fmt:message key="users.changeRole"/></button>
                </form>
              </td>
              <td>
                <c:set var="statusAction" value="${account.enabled ? '/admin/users/disable' : '/admin/users/enable'}"/>
                <form method="post" action="<c:url value='${statusAction}'/>" class="inline-form">
                  <input type="hidden" name="_csrf" value="${_csrf.token}">
                  <input type="hidden" name="id" value="${account.id}">
                  <fmt:message key="${account.enabled ? 'users.enabled' : 'users.disabled'}"/>
                  <button class="btn btn--sm btn--secondary" type="submit"><fmt:message key="${account.enabled ? 'users.disable' : 'users.enable'}"/></button>
                </form>
                <%-- <c:remove> (35.A): drop this row's page-scoped helpers, so the NEXT row can't read a stale value --%>
                <c:remove var="statusAction"/>
                <c:remove var="roleLabel"/>
              </td>
            </c:otherwise>
          </c:choose>
        </tr>
      </c:forEach>
      </tbody>
    </table>
<%@ include file="/WEB-INF/views/common/footer.jspf" %>
