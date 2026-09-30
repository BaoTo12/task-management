<%--
  S40 (40.15): shown by MaintenanceModeFilter with status 503. A plain page: no data, no forms, no session.
--%>
<%@ page contentType="text/html;charset=UTF-8" pageEncoding="UTF-8" session="false" trimDirectiveWhitespaces="true" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%@ include file="/WEB-INF/views/common/header.jspf" %>
    <h1 class="page__title"><fmt:message key="maintenance.title"/></h1>
    <p class="maintenance"><fmt:message key="maintenance.text"/></p>
<%@ include file="/WEB-INF/views/common/footer.jspf" %>
