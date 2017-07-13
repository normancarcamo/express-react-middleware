import React, { Component } from 'react'

class App extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    return (
      <div>
        <h1>Welcome to my App {this.props.name}!</h1>
      </div>
    )
  }
}

export default App