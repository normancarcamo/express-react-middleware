import React from 'react'
import { Route } from 'react-router-dom'

const Status = ({ code, children }) => (
  <Route render={({ staticContext }) => {
    if (staticContext) {
      staticContext.status = code
    }
    return children
  }}/>
)

const NotFound = (props) => (
  <Status code={404}>
    <div>
      <h2> Sorry, cannot find this page</h2>
    </div>
  </Status>
)

export default NotFound