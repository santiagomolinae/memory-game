import React, { Component } from 'react';
import Header from './Header';
import Board from './Board';
import './App.css';
import BuildDeck from './utils/BuildDeck';



const getInitialState = () => {
  const deck = BuildDeck();
  return{
    deck,
    selectedCouple : [],
    comparisonBool: false,
    numberOfTries: 0
  };
}

class App extends Component{
  constructor(props){
    super(props)
      this.state = getInitialState();
    }

  render(){
    return (
      <div className="App">
      <Header 
        numberOfTries={this.state.numberOfTries}
        resetGame={() => this.resetGame()}
      />
      <Board 
        deck={this.state.deck}
        selectedCouple={this.state.selectedCouple}
        selectCard={(card) => this.selectCard(card)}
      />
      </div>
    );
  }

  selectCard(card){
    if(
      this.state.comparisonBool || 
      this.state.selectedCouple.indexOf(card) > -1 ||
      card.wasGuessed
    ){ 
      return;
    }
    const selectedCouple = [...this.state.selectedCouple, card];
    this.setState({selectedCouple});

    if(selectedCouple.length === 2){
      this.compareCouple(selectedCouple);
    }
  }

  compareCouple(selectedCouple){
    this.setState({comparisonBool: true});

    setTimeout(() => {
      const [firstCard, secondCard] = selectedCouple;
      let deck = this.state.deck;

      if(firstCard.icon === secondCard.icon){
        deck = deck.map((card) => {
          if(card.icon !== firstCard.icon){
            return card;
          }

          return{...card, wasGuessed: true};

        });
      }
      
      this.checkIfThereIsAWinner(deck);
      this.setState({
        selectedCouple: [],
        deck,
        comparisonBool: false,
        numberOfTries: this.state.numberOfTries + 1
      })
    }, 1000)
  }

  checkIfThereIsAWinner(deck){
    if(
      deck.filter((card) => !card.wasGuessed)
      .length === 0
    ){
      alert('You have win in ' + this.state.numberOfTries+ ' tries');
    }
  }

  resetGame(){
    this.setState(
      getInitialState()
    );
  }

}

export default App;
