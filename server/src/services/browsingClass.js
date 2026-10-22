'use strict'
// Which class a request is browsing. The home page's class chip lets a student look at
// another year's content; Resources and Practice already take it as ?class=, and the
// textbook routes resolve it the same way: a valid explicit ?class= (6–12, "9" or
// "Class 9") wins, else the profile class from req.scope, else null.
function browsingClass(req) {
  const q = req && req.query ? req.query.class : undefined
  if (q != null && q !== '') {
    const m = String(q).match(/\d{1,2}/)
    const n = m ? parseInt(m[0], 10) : NaN
    if (n >= 1 && n <= 12) return n
  }
  return (req && req.scope && req.scope.classNum) || null
}

module.exports = { browsingClass }
