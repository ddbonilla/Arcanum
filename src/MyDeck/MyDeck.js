import React, {useContext, useEffect, useState} from "react";
import MyDecklist from "./MyDecklist";
import {mtgContext} from "../App";
import "./Deck.css"

const MyDeck = () => {
  const {decks, setDecks} = useContext(mtgContext);
  
  useEffect(()=> {
    document.title = 'Arcanum: Featured Decks'
  },[])

  const [file, setFile] = useState('');

  const handleFileChange = (e) => {
    console.log('handleFileChange called with:', e.target.files[0]);
    e.preventDefault()
    if (! e.target.files) {
      return;
    }
    setFile(e.target.files[0]);
  };

  useEffect(() => {
    if (file) {
      if (file.name) {

      }
      const currentFile = file;
      importFile(currentFile);
    }
  }, [file])


  const importFile = async (file) => {
    const reader = new FileReader()
    reader.onload = async (e) => { 
      const text = (e.target.result)
      parse(text)
    };
    reader.readAsText(file)
  }

  const parse = (text) => {
    const lines = text.split('\n')
    let cards = [];
    for (let line of lines) {
      // Stop at the first blank line (skips the sideboard)
      if (! line.match(/^\d/)) {
        pullCards(cards);
        break;
      }

      let parts = line.trim().split(' ');
      let card = {
        count: parts[0],
        name: parts.slice(1).join(' '),
      };
      cards.push(card);
    }
  }

  const pullCards = (cards) => {
    console.log('pulling cards:', cards)

    let promises = [];
    for (let card of cards) {
      let cleanName = card.name.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').replace(/ /g, '+').toLowerCase();
      promises.push(
        fetch(`https://api.scryfall.com/cards/named?exact=${cleanName}`)
          .then((res) => res.json())
          .then((data) => {
            return ({count: card.count, cardObj: data})
          })
      )
    }

    Promise.all(promises)
      .then(result => {
        let deckList = result.map((card) => ({...card, id: card.cardObj.id, name: card.cardObj.name}))
        let deckNames = decks.map((deck) => deck.name);
        const newDeckName = file.name.split('.').slice(0, -1).join('.')
        if (deckNames.includes(newDeckName)) {
          const existingDeckIndex = deckNames.indexOf(newDeckName);
          let tempDecks = [...decks];
          tempDecks.splice(existingDeckIndex, 1)
          setDecks([...tempDecks, {name: newDeckName, deckItems: deckList}])
        } else {
          setDecks([...decks, {name: newDeckName, deckItems: deckList}])
        }
      })
  }

  
  const exportFile = () => {

    const element = document.createElement("a");
    const deckName = document.getElementById('DecksDropdown').value
    let deckList = '';
    for (let deck of decks) {
      if (deck.name === deckName) {
        deckList = deck.deckItems;
      }
    }
    const file = new Blob(encode(deckList), {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${deckName}.txt`;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  }

  const encode = (deck) => {
    let encoded = [];
    for (let o of deck) {
      encoded.push(o.count)
      encoded.push(' ')
      encoded.push(o.cardObj.name)
      encoded.push('\n')
    }
    return encoded;
  }

  useEffect(() => {
    let deckNames = decks.map((deck) => deck.name);
    let decksDropdownElement = document.getElementById('DecksDropdown');
    while (decksDropdownElement.options.length > 0) {
      decksDropdownElement.remove(0);
    }
    deckNames.forEach(deckName => {
      if (deckName === 'My Deck') {
        decksDropdownElement.add(
          new Option(deckName, deckName, true)
        )
      } else {
        decksDropdownElement.add(
          new Option(deckName, deckName, false)
        )
      }
    });
  }, [decks])

  return (
    <div className="import-export-bar relative flex-1">
      <div className="import-bar relative w-full flex flex-wrap items-center justify-end shadow-lg px-4"> 
        <div className="import">
          {file.name}
          <label className="import-btn-label p-3" htmlFor="import-btn">Import</label>
          <input className="import-btn p-3" id="import-btn" type="file" onChange={handleFileChange} />
        </div>
        <span className="import-export-span">| |</span>
        <div className="export">
          <button className="p-3" onClick={() => exportFile()}>Export</button> 
          <i className="ss ss-jmp"/>
          <label className="import-select-label text-sm p-3" htmlFor="import-dropdown">Select a Deck:</label>
          <select className="import-select text-sm" id="DecksDropdown" />
        </div>
      </div>
      {decks.map(deck => <MyDecklist key={deck.name} deck={deck}/>)}
    </div>
  );
};


export default MyDeck;
