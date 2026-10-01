<%--
  Status 403: a USER on /admin/**, a form without a valid CSRF token, someone else's task. It says what happened, not
  why in detail: the details (who, what, from where) are in the audit log (PageAccessDeniedHandler, PageExceptionHandler).
--%>
<%@ page contentType="text/html;charset=UTF-8" pageEncoding="UTF-8" session="false" trimDirectiveWhitespaces="true" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<fmt:message key="errors.403.title" var="pageTitle"/>
<%@ include file="/WEB-INF/views/common/header.jspf" %>
    <h1 class="page__title">${pageTitle}</h1>
    <p class="error-page__text"><fmt:message key="errors.403.text"/></p>
    <p><a href="<c:url value='/tasks'/>"><fmt:message key="errors.back"/></a></p>
<%@ include file="/WEB-INF/views/common/footer.jspf" %>