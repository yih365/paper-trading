import React, { useEffect } from "react";
import Axios from 'axios';
import "./Quote.css";
import { useHistory } from "react-router-dom";
import { Redirect } from "react-router-dom";
 
function Quote() {
    let history = useHistory();
 
    const [loginStatus, setLoginStatus] = React.useState(null);
    const [symbol, setSymbol] = React.useState(null);
    const [price, setPrice] = React.useState("");
    const [quoteText, setQuoteText] = React.useState("");
    const [quoteStatus, setQuoteStatus] = React.useState(false);
    const [buyShares, setBuyShares] = React.useState(0);
    const [sellShares, setSellShares] = React.useState(0);
    const [buyStatus, setBuyStatus] = React.useState("");
    const [sellStatus, setSellStatus] = React.useState("");
    Axios.defaults.withCredentials = true;
 
    const quote = () => {
        Axios.post('/api/quote', {
        symbol: symbol
        }).then((res) => {
        if (res.data.found === true) {
            if (res.data.result) {
                let quoteResult = res.data.result;
                setQuoteStatus(true);
                setBuyStatus("");
                setSellStatus("");
 
                // Get specific quote info
                setQuoteText(quoteResult.symbol + ': ' + quoteResult.companyName);
                setPrice('Current Price: $' + quoteResult.latestPrice.toString());
            } else {
                setQuoteText('Sorry there has been an error');
                setPrice("");
                setBuyStatus("");
                setSellStatus("");
                setQuoteStatus(false);
            }
        } else {
            setQuoteText(res.data.message);
            setPrice("");
            setBuyStatus("");
            setSellStatus("");
            setQuoteStatus(false);
        }
        });
    };
 
    const toPortfolio = () => {
        history.push('/account');
    }
 
    const buy = () => {
        if (Number(buyShares)%1 == 0) {
            Axios.post('/api/buy', {
                symbol: symbol,
                shares: buyShares
            }).then((res) => {
                if (res.data.err) console.log(res.data.err);
                if (res.data.message) setBuyStatus(res.data.message);
            });
        } else {
            setBuyStatus('Sorry, shares must be a whole number');
        }
    }
 
    const sell = () => {
        if (Number(sellShares)%1 == 0) {
            Axios.post('/api/sell', {
                symbol: symbol,
                shares: sellShares
            }).then((res) => {
                if (res.data.err) console.log(res.data.err);
                if (res.data.message) setSellStatus(res.data.message);
            });
        } else {
            setSellStatus('Sorry, shares must be a whole number');
        }
    }
 
    React.useEffect(() => {
        Axios.get('/api/login').then((response) => {
        if (response.data.loggedIn === true) {
            setLoginStatus(true);
        } else {
            setLoginStatus(false);
        };
        console.log(response);
        });
    }, []);
    if (loginStatus === false) {
        console.log(loginStatus);
        return (<Redirect to="/" />);
    }
 
    return (
        <div className="App">
        <header className="App-header">
        <button onClick={toPortfolio}>Return to Portfolio</button>
            <p>Quote, Buy, and Sell Here</p>
        </header>
 
            <div className="quote">
                <h1>Quote</h1>
                <label>Ticker Symbol</label>
                <input
                    type="text"
                    onChange={(e) => {
                    setSymbol(e.target.value);
                    }}
                />
                <button onClick={quote}>Quote</button>
                <br/>
                <h2>{quoteText}</h2>
                <h2>{price}</h2>
            </div>
 
            {quoteStatus && <div className="buy">
                <label>Buy</label>
                <input
                    type="text"
                    onChange={(e) => {
                        setBuyShares(e.target.value);
                    }}
                />
                <button onClick={buy}>Buy</button>
                <h2>{buyStatus}</h2>
            </div>}
 
            {quoteStatus && <div className="sell">
                <label>Sell</label>
                <input
                    type="text"
                    onChange={(e) => {
                        setSellShares(e.target.value);
                    }}
                />
                <button onClick={sell}>Sell</button>
                <br/>
                <h2>{sellStatus}</h2>
            </div>}
            
        </div>
    );
}
 
export default Quote;

