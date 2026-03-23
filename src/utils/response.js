function success(res, data = {}, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({ ok: true, message, data });
}

function created(res, data = {}, message = 'Created') {
  return success(res, data, message, 201);
}

function error(res, message = 'Something went wrong', statusCode = 500, details = null) {
  const body = { ok: false, message };
  if (details) body.details = details;
  return res.status(statusCode).json(body);
}

function badRequest(res, message = 'Bad request', details = null) {
  return error(res, message, 400, details);
}

function unauthorized(res, message = 'Unauthorized') {
  return error(res, message, 401);
}

function forbidden(res, message = 'Forbidden') {
  return error(res, message, 403);
}

function notFound(res, message = 'Not found') {
  return error(res, message, 404);
}

module.exports = { success, created, error, badRequest, unauthorized, forbidden, notFound };
