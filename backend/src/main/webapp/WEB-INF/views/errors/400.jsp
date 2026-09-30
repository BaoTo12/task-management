<%--
  S43 (43.12): status 400. The message comes from sendError(400, message): ErrorHandlingFilter passes the text of
  a BadRequestException, which is always written by us (43.12). Escaped anyway: it's output (34.18).
--%>
<%@ page contentType="text/html;charset=UTF-8" pageEncoding="UTF-8" session="false" trimDirectiveWhitespaces="true" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<fmt:message key="errors.400.title" var="pageTitle"/>
<%@ include file="/WEB-INF/views/common/header.jspf" %>
    <h1 class="page__title">${pageTitle}</h1>
    <c:set var="message" value="${requestScope['javax.servlet.error.message']}"/>
    <p class="error-page__text"><c:choose><c:when test="${empty message}"><fmt:message key="errors.400.text"/></c:when><c:otherwise><c:out value="${message}"/></c:otherwise></c:choose></p>
    <p><a href="<c:url value='/tasks'/>"><fmt:message key="errors.back"/></a></p>
<%@ include file="/WEB-INF/views/common/footer.jspf" %>