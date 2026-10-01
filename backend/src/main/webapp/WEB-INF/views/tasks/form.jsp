<%--
  ONE form for creating and editing a task, with SPRING'S FORM TAGS (prefix "form"). TaskFormController put the form
  object in the model as "form"; <form:form modelAttribute="form"> binds to it:
    <form:input path="title"/>      value = form.title, or what the user typed if it was rejected; HTML-escaped
    <form:errors path="title"/>     the field's errors from the BindingResult (Bean Validation, typeMismatch,
                                    the service's rejectValue): nothing at all when there are none
    <form:select> + <form:options>  the <option> list, with the current value pre-selected
  <form:form> also adds the hidden _csrf field BY ITSELF (Spring Security's RequestDataValueProcessor), and the
  escaping is on by default (htmlEscape). Compare the categories page, which writes the same things by hand.
  Other attributes: priorities, categories, projects (ProjectSummary), people (User), taskId (null = new), formAction.
--%>
<%@ page contentType="text/html;charset=UTF-8" pageEncoding="UTF-8" session="false" trimDirectiveWhitespaces="true" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<%@ taglib prefix="form" uri="http://www.springframework.org/tags/form" %>
<%@ include file="/WEB-INF/views/common/header.jspf" %>
    <h1 class="page__title"><c:out value="${pageTitle}"/></h1>

    <c:url var="action" value="${formAction}"/>
    <form:form modelAttribute="form" action="${action}" method="post" cssClass="form">

      <div class="form-field">
        <form:label path="title" cssClass="form-field__label" cssErrorClass="form-field__label form-field--error"><fmt:message key="form.title"/></form:label>
        <form:input path="title" cssClass="form-field__input" maxlength="120" required="required"/>
        <form:errors path="title" cssClass="form-field__error" element="span"/>
      </div>

      <div class="form-field">
        <form:label path="description" cssClass="form-field__label"><fmt:message key="form.description"/></form:label>
        <form:textarea path="description" cssClass="form-field__input" rows="4" maxlength="2000"/>
        <form:errors path="description" cssClass="form-field__error" element="span"/>
      </div>

      <div class="form-field">
        <form:label path="priority" cssClass="form-field__label"><fmt:message key="form.priority"/></form:label>
        <form:select path="priority" cssClass="form-field__input">
          <c:forEach items="${priorities}" var="p">
            <fmt:message key="priority.${p}" var="priorityLabel"/>
            <form:option value="${p}" label="${priorityLabel}"/>
          </c:forEach>
        </form:select>
        <form:errors path="priority" cssClass="form-field__error" element="span"/>
      </div>

      <div class="form-field">
        <form:label path="dueDate" cssClass="form-field__label"><fmt:message key="form.dueDate"/></form:label>
        <form:input path="dueDate" type="date" cssClass="form-field__input"/>
        <form:errors path="dueDate" cssClass="form-field__error" element="span"/>
      </div>

      <div class="form-field">
        <form:label path="categoryId" cssClass="form-field__label"><fmt:message key="form.category"/></form:label>
        <form:select path="categoryId" cssClass="form-field__input">
          <fmt:message key="form.noCategory" var="noCategory"/>
          <form:option value="" label="${noCategory}"/>
          <form:options items="${categories}" itemValue="id" itemLabel="name"/>
        </form:select>
        <form:errors path="categoryId" cssClass="form-field__error" element="span"/>
      </div>

      <div class="form-field">
        <form:label path="projectId" cssClass="form-field__label"><fmt:message key="form.project"/></form:label>
        <form:select path="projectId" cssClass="form-field__input">
          <fmt:message key="form.noProject" var="noProject"/>
          <form:option value="" label="${noProject}"/>
          <c:forEach items="${projects}" var="summary">
            <form:option value="${summary.project.id}" label="${summary.project.name}"/>
          </c:forEach>
        </form:select>
        <form:errors path="projectId" cssClass="form-field__error" element="span"/>
      </div>

      <div class="form-field">
        <form:label path="assigneeId" cssClass="form-field__label"><fmt:message key="form.assignee"/></form:label>
        <form:select path="assigneeId" cssClass="form-field__input">
          <fmt:message key="form.unassigned" var="unassigned"/>
          <form:option value="" label="${unassigned}"/>
          <form:options items="${people}" itemValue="id" itemLabel="displayName"/>
        </form:select>
        <form:errors path="assigneeId" cssClass="form-field__error" element="span"/>
      </div>

      <div class="form__actions">
        <button class="btn btn--primary" type="submit"><fmt:message key="${empty taskId ? 'form.create' : 'form.save'}"/></button>
        <c:url var="cancelUrl" value="${empty taskId ? '/tasks' : '/tasks/view'}"><c:if test="${not empty taskId}"><c:param name="id" value="${taskId}"/></c:if></c:url>
        <a class="btn btn--secondary" href="${cancelUrl}"><fmt:message key="form.cancel"/></a>
      </div>
    </form:form>
<%@ include file="/WEB-INF/views/common/footer.jspf" %>
