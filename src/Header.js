import React, { Component } from 'react';
import './Header.css';
export default class Header extends Component{
    render() {
        return(
            <header>
                <div className="Title">memory-game</div>
                <div>
                    <button 
                        className="Button-restart"
                        onClick={this.props.resetGame}
                        >
                        Restart
                    </button>
                </div>
                <div className="Title">
                    Attempts: {this.props.numberOfTries}
                </div>
            </header>
        );
    }
};