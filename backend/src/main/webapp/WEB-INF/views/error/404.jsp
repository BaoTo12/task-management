<%--
  Status 404, reached through Spring Boot's error dispatch: a controller threw NotFoundException (@ResponseStatus 404),
  or no controller and no static file matched. Only a fixed text: nothing from the exception or the URL.
--%>
<%@ page contentType="text/html;charset=UTF-8" pageEncoding="UTF-8" session="false" trimDirectiveWhitespaces="true" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<fmt:message key="errors.404.title" var="pageTitle"/>
<%@ include file="/WEB-INF/views/common/header.jspf" %>
    <h1 class="page__title">${pageTitle}</h1>
    <p class="error-page__text"><fmt:message key="errors.404.text"/></p>
    <p><a href="<c:url value='/tasks'/>"><fmt:message key="errors.back"/></a></p>
<%@ include file="/WEB-INF/views/common/footer.jspf" %>