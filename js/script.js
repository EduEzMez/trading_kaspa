const API_URL = "http://localhost:3000/kaspa";

let balanceUSDT = 0;
let balanceKaspa = 1000;
let lastTradePrice = 0;
let tradeHistory = [];
const tradingFee = 0.001;
const tradePercentage = 0.5;
const stopLossPercentage = 0.02;
const takeProfitPercentage = 0.05;
let priceHistory = [];

async function fetchKaspaData() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error al obtener los datos de Kaspa", error);
        return null;
    }
}

function analyzeSignals(rsi, macd, sma, ema) {
    if (rsi < 30 && macd.MACD > macd.signal && ema > sma) {
        executeTrade("BUY");
        return "🔼 Señal de COMPRA: RSI bajo, MACD cruzando al alza y EMA por encima de SMA";
    }
    if (rsi > 70 && macd.MACD < macd.signal && ema < sma) {
        executeTrade("SELL");
        return "🔽 Señal de VENTA: RSI alto, MACD cruzando a la baja y EMA por debajo de SMA";
    }
    return "⚪ Esperando mejor oportunidad...";
}

function executeTrade(type) {
    const price = parseFloat(document.getElementById("kaspa-price").textContent.replace("$", ""));
    if (!price) return;
    
    const tradeAmountUSDT = balanceUSDT * tradePercentage;
    const tradeAmountKaspa = balanceKaspa * tradePercentage;
    
    if (type === "BUY" && balanceUSDT > 0) {
        let kaspaPurchased = (tradeAmountUSDT / price) * (1 - tradingFee);
        balanceKaspa += kaspaPurchased;
        balanceUSDT -= tradeAmountUSDT;
        lastTradePrice = price;
        tradeHistory.push({ type: "BUY", price, amount: kaspaPurchased, date: new Date().toLocaleString() });
    }
    if (type === "SELL" && balanceKaspa > 0) {
        let usdtReceived = (tradeAmountKaspa * price) * (1 - tradingFee);
        balanceUSDT += usdtReceived;
        balanceKaspa -= tradeAmountKaspa;
        lastTradePrice = price;
        tradeHistory.push({ type: "SELL", price, amount: usdtReceived, date: new Date().toLocaleString() });
    }
    updateBalanceDisplay();
}

function checkStopLossTakeProfit(price) {
    if (lastTradePrice > 0) {
        if (price <= lastTradePrice * (1 - stopLossPercentage)) {
            executeTrade("SELL");
        } else if (price >= lastTradePrice * (1 + takeProfitPercentage)) {
            executeTrade("SELL");
        }
    }
}

function updateBalanceDisplay() {
    document.getElementById("balance-usdt").textContent = `Saldo USDT: $${balanceUSDT.toFixed(2)}`;
    document.getElementById("balance-kaspa").textContent = `Saldo Kaspa: ${balanceKaspa.toFixed(4)}`;
    document.getElementById("trade-history").innerHTML = tradeHistory.map(trade => `<li>${trade.date} - ${trade.type} a $${trade.price.toFixed(4)} (${trade.amount.toFixed(4)})</li>`).join("");
}

async function updatePriceDisplay() {
    const priceElement = document.getElementById("kaspa-price");
    const rsiElement = document.getElementById("kaspa-rsi");
    const macdElement = document.getElementById("kaspa-macd");
    const smaElement = document.getElementById("kaspa-sma");
    const emaElement = document.getElementById("kaspa-ema");
    const signalElement = document.getElementById("kaspa-signal");
    
    const data = await fetchKaspaData();
    if (data) {
        priceElement.textContent = `$${data.price.toFixed(4)}`;
        rsiElement.textContent = `RSI: ${data.rsi.toFixed(2)}`;
        macdElement.textContent = `MACD: ${data.macd.MACD.toFixed(4)}`;
        smaElement.textContent = `SMA: ${data.sma.toFixed(4)}`;
        emaElement.textContent = `EMA: ${data.ema.toFixed(4)}`;
        signalElement.textContent = analyzeSignals(data.rsi, data.macd, data.sma, data.ema);
        checkStopLossTakeProfit(data.price);
        priceHistory.push({ time: new Date().toLocaleTimeString(), price: data.price });
        updateChart();
    } else {
        priceElement.textContent = "Error obteniendo datos";
        signalElement.textContent = "Error en análisis";
    }
}

function updateChart() {
    const ctx = document.getElementById("price-chart").getContext("2d");
    const chartData = {
        labels: priceHistory.map(entry => entry.time),
        datasets: [{
            label: "Precio Kaspa",
            data: priceHistory.map(entry => entry.price),
            borderColor: "blue",
            borderWidth: 2,
            fill: false
        }]
    };
    new Chart(ctx, { type: "line", data: chartData });
}

setInterval(updatePriceDisplay, 5000);

document.addEventListener("DOMContentLoaded", () => {
    updatePriceDisplay();
    updateBalanceDisplay();
});
