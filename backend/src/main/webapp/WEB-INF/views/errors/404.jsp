<%--
  S43 (43.06): <error-page> for 404, reached by an ERROR dispatch (43.03): the same request object, with the
  javax.servlet.error.* attributes added. Only a fixed text for the user; nothing from the exception or the URL.
--%>
<%@ page contentType="text/html;charset=UTF-8" pageEncoding="UTF-8" session="false" trimDirectiveWhitespaces="true" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<fmt:message key="errors.404.title" var="pageTitle"/>
<%@ include file="/WEB-INF/views/common/header.jspf" %>
    <h1 class="page__title">${pageTitle}</h1>
    <p class="error-page__text"><fmt:message key="errors.404.text"/></p>
    <p><a href="<c:url value='/tasks'/>"><fmt:message key="errors.back"/></a></p>
<%@ include file="/WEB-INF/views/common/footer.jspf" %>