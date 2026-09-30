<%--
  S37 (37.15): category management. CategoryListServlet set: categories, counts (Map<Long, Integer>), newForm, errors
  and csrfToken. Every form POSTs with the token; every success is a 303 back here with a flash message (PRG).
--%>
<%@ page contentType="text/html;charset=UTF-8" pageEncoding="UTF-8" session="false" trimDirectiveWhitespaces="true" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%@ include file="/WEB-INF/views/common/header.jspf" %>
    <h1 class="page__title"><fmt:message key="page.categories"/></h1>

    <%-- S39 (39.05): a shared, request-time fragment, with a parameter. --%>
    <fmt:message key="categories.notSaved" var="notSavedTitle"/>
    <jsp:include page="/WEB-INF/views/common/form-errors.jsp">
      <jsp:param name="title" value="${notSavedTitle}"/>
    </jsp:include>

    <table class="categories">
      <thead><tr><th><fmt:message key="categories.col.name"/></th><th><fmt:message key="categories.col.tasks"/></th><th></th></tr></thead>
      <tbody>
      <c:forEach items="${categories}" var="category">
        <tr>
          <td>
            <form method="post" action="<c:url value='/categories/save'/>" class="inline-form">
              <input type="hidden" name="_csrf" value="${csrfToken}">
              <input type="hidden" name="id" value="${category.id}">
              <input name="name" maxlength="50" value="${fn:escapeXml(category.name)}" aria-label="<fmt:message key='categories.name'/>">
              <input type="color" name="color" value="${fn:escapeXml(category.color)}" aria-label="<fmt:message key='categories.colour'/>">
              <button class="btn btn--sm btn--secondary" type="submit"><fmt:message key="categories.save"/></button>
            </form>
          </td>
          <td class="category__count"><fmt:formatNumber value="${counts[category.id] + 0}"/></td>
          <td>
            <form method="post" action="<c:url value='/categories/delete'/>" class="inline-form" data-confirm-title="${fn:escapeXml(category.name)}">
              <input type="hidden" name="_csrf" value="${csrfToken}">
              <input type="hidden" name="id" value="${category.id}">
              <button class="btn btn--sm btn--secondary" type="submit"><fmt:message key="categories.delete"/></button>
            </form>
          </td>
        </tr>
      </c:forEach>
      </tbody>
    </table>

    <h2><fmt:message key="categories.new"/></h2>
    <form method="post" action="<c:url value='/categories/save'/>">
      <input type="hidden" name="_csrf" value="${csrfToken}">
      <input name="name" maxlength="50" required value="${fn:escapeXml(newForm.name)}" aria-label="<fmt:message key='categories.name'/>">
      <input type="color" name="color" value="${fn:escapeXml(newForm.color)}" aria-label="<fmt:message key='categories.colour'/>">
      <button class="btn btn--sm btn--primary" type="submit"><fmt:message key="categories.add"/></button>
    </form>
<%@ include file="/WEB-INF/views/common/footer.jspf" %>
