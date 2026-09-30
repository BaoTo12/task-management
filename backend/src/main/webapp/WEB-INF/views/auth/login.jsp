<%--
  S41 (41.07): the login form. LoginServlet set: username (what was typed, never the password), error, expired,
  returnUrl (already checked by Redirects), csrfToken. The password field is never echoed back.
--%>
<%@ page contentType="text/html;charset=UTF-8" pageEncoding="UTF-8" session="false" trimDirectiveWhitespaces="true" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%@ include file="/WEB-INF/views/common/header.jspf" %>
    <h1 class="page__title"><fmt:message key="page.login"/></h1>
    <c:if test="${expired}"><p class="flash" role="status"><fmt:message key="login.expired"/></p></c:if>
    <c:if test="${not empty error}"><p class="form-field__error login__error" role="alert"><c:out value="${error}"/></p></c:if>
    <form class="form" method="post" action="<c:url value='/login'/>">
      <input type="hidden" name="_csrf" value="${csrfToken}">
      <input type="hidden" name="returnUrl" value="${fn:escapeXml(returnUrl)}">
      <div class="form-field">
        <label class="form-field__label"><fmt:message key="login.username"/>
          <input class="form-field__input" name="username" autocomplete="username" required value="${fn:escapeXml(username)}">
        </label>
      </div>
      <div class="form-field">
        <label class="form-field__label"><fmt:message key="login.password"/>
          <input class="form-field__input" type="password" name="password" autocomplete="current-password" required>
        </label>
      </div>
      <div class="form__actions"><button class="btn btn--primary" type="submit"><fmt:message key="login.submit"/></button></div>
    </form>
<%@ include file="/WEB-INF/views/common/footer.jspf" %>
