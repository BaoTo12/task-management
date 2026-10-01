<%--
  Every OTHER 4xx (405, 413 for a too-big upload, …): Spring Boot's DefaultErrorViewResolver tries error/<code>.jsp,
  then error/4xx.jsp. BasicErrorController's model has "status", "error" (the reason phrase), "path", "timestamp".
--%>
<%@ page contentType="text/html;charset=UTF-8" pageEncoding="UTF-8" session="false" trimDirectiveWhitespaces="true" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<fmt:message key="errors.other.title" var="pageTitle"><fmt:param value="${status}"/></fmt:message>
<%@ include file="/WEB-INF/views/common/header.jspf" %>
    <h1 class="page__title">${pageTitle}</h1>
    <p class="error-page__text"><fmt:message key="errors.other.text"/></p>
    <p><a href="<c:url value='/tasks'/>"><fmt:message key="errors.back"/></a></p>
<%@ include file="/WEB-INF/views/common/footer.jspf" %>