<%--
  S43 (43.02): the DEFAULT error page (an <error-page> with only a <location>, Servlet 3.0+): every status without a
  page of its own (405, 413, …). pageContext.errorData (a javax.servlet.jsp.ErrorData) exposes the error attributes.
--%>
<%@ page contentType="text/html;charset=UTF-8" pageEncoding="UTF-8" session="false" trimDirectiveWhitespaces="true" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<fmt:message key="errors.other.title" var="pageTitle"><fmt:param value="${pageContext.errorData.statusCode}"/></fmt:message>
<%@ include file="/WEB-INF/views/common/header.jspf" %>
    <h1 class="page__title">${pageTitle}</h1>
    <p class="error-page__text"><fmt:message key="errors.other.text"/></p>
    <p><a href="<c:url value='/tasks'/>"><fmt:message key="errors.back"/></a></p>
<%@ include file="/WEB-INF/views/common/footer.jspf" %>