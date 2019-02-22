import React, { Component } from 'react';
import injectSheet from 'react-jss';
import styles from './modallauncherstyles'; // Import styles
import Modal from 'components/modal/modal'; // Import Modal component

// Declaration of the component as React Class Component
class ModalLauncher extends Component {
  
  // Init of the component before it is mounted.
  // Sets the modal visibility (showModal) to false.
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      content: "",
    };
  }
  
  // Handle the visibility of the modal.
  // If `state.showModal` is false, sets it to true,
  // if is true, sets it to false.
  handleToggleModal() {
    
    this.setState(
      { showModal: !this.state.showModal,
        content: this.state.exportText}
      );
    var x = this.state
    debugger;
  }

  render() {
    const { classes } = this.props;
    const { showModal } = this.state;
    return (
      <div>
        <button
          type="button"
          className={classes.modalButton}
          onClick={() => this.handleToggleModal()}
        >
          Open Modal
        </button>

        {showModal &&
          <Modal onCloseRequest={() => this.handleToggleModal()}>
            <div> {this.content} </div>
          </Modal>}
      </div>
    );
  }
}

export default injectSheet(styles)(ModalLauncher);