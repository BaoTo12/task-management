<%--
  S43 (43.06, 43.10): status 500, and any exception that reaches the container. The user gets an apology and the
  REQUEST ID (43.12): the same id is in X-Request-Id and in every log line of this request (40.06), so support can
  find the stack trace in the logs. Never the exception, its message, a stack trace or a version (43.09).
--%>
<%@ page contentType="text/html;charset=UTF-8" pageEncoding="UTF-8" session="false" trimDirectiveWhitespaces="true" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<fmt:message key="errors.500.title" var="pageTitle"/>
<%@ include file="/WEB-INF/views/common/header.jspf" %>
    <h1 class="page__title">${pageTitle}</h1>
    <p class="error-page__text"><fmt:message key="errors.500.text"/></p>
    <c:if test="${not empty requestId}">
      <p class="error-page__reference"><fmt:message key="errors.500.reference"/> <code>${requestId}</code></p>
    </c:if>
    <p><a href="<c:url value='/tasks'/>"><fmt:message key="errors.back"/></a></p>
<%@ include file="/WEB-INF/views/common/footer.jspf" %>