import React, { Component } from 'react';
import './Card.css';
import ReactCardFlip from 'react-card-flip';

export default class Card extends Component {

    constructor() {
        super();
          this.state = {
          isFlipped: false
        };
        this.handleClick = this.handleClick.bind(this);
      }

    handleClick(e) {
        e.preventDefault();
        this.setState(prevState => ({ isFlipped: !prevState.isFlipped }));
      }
      
    render(){
        return(
            <div className="Card" onClick={this.props.selectCard}>  
                <ReactCardFlip  
                    flipDirection="vertical"
                    isFlipped={this.props.isBeingCompared|| this.props.wasGuessed}
                    disabled={true}
                >
                    <div className="CoverPage" key="front"></div>
                    <div className="Content" key="back">
                        <i className={`fa ${this.props.icon} fa-5x`}></i>
                    </div>
                </ReactCardFlip>
            </div>
        );
    }
};