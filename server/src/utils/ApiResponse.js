'use strict'

class ApiResponse {
  static success(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({ success: true, message, data })
  }

  static created(res, data, message = 'Created') {
    return ApiResponse.success(res, data, message, 201)
  }

  static error(res, message, statusCode = 400) {
    return res.status(statusCode).json({ success: false, error: message })
  }
}

module.exports = ApiResponse
