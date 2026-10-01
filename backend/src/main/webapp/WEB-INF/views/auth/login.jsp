<%--
  The login form. POST /login is answered by Spring Security itself (formLogin): it reads the parameters "username" and
  "password" and checks the "_csrf" token. After a failure, LoginFailureHandler redirects back here with two flash
  attributes: error (one generic message) and username (what was typed, never the password).
  expired: set by LoginPageController when LoginEntryPoint added ?expired=1 (the session timed out).
  There is no returnUrl field any more: Spring Security remembers the page the user wanted (its RequestCache).
--%>
<%@ page contentType="text/html;charset=UTF-8" pageEncoding="UTF-8" session="false" trimDirectiveWhitespaces="true" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fn" uri="jakarta.tags.functions" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<%@ include file="/WEB-INF/views/common/header.jspf" %>
    <h1 class="page__title"><fmt:message key="page.login"/></h1>
    <c:if test="${expired}"><p class="flash" role="status"><fmt:message key="login.expired"/></p></c:if>
    <c:if test="${not empty error}"><p class="form-field__error login__error" role="alert"><c:out value="${error}"/></p></c:if>
    <form class="form" method="post" action="<c:url value='/login'/>">
      <input type="hidden" name="${_csrf.parameterName}" value="${_csrf.token}">
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
