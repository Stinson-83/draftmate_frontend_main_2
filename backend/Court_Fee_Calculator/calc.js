const form = document.getElementById('Vadi004');
let num1 = "0";
let courtFees = 0;
let num2 = "0";
let strState;
function abc() {
    console.log("abc");

    const state = document.getElementById('state');
    strState = state.value;
    console.log(strState);
    num1 = document.getElementById("num1").value;
    num2 = num1;
    if (isNaN(num1) || num1 < 1) {
        alert("The value should be greater than 1.");
        submitOK = "false";
    }

    if (strState === ("Select State")) {
        alert("Please select a state.");
    } else if (strState === ("Haryana")) {
        calHaryana();
    } else if (strState === ("Tamil Nadu")) {
        calTN();
    } else if (strState === ("Andhra Pradesh")) {
        calAndhraP();
    } else if (strState === ("Assam")) {
        calAssam();
    } else if (strState === ("Bihar")) {
        calBihar();
    } else if (strState === ("Chandigarh")) {
        calDelhi();
    } else if (strState === ("Delhi")) {
        calDelhi();
    } else if (strState === ("Gujarat")) {
        calGujarat();
    } else if (strState === ("Himachal Pradesh")) {
        calHimachalP();
    } else if (strState === ("Jharkhand")) {
        calBihar();
    } else if (strState === ("Karnatka")) {
        calKarnatka();
    } else if (strState === ("Kerala")) {
        calKerala();
    } else if (strState === ("Maharashtra")) {
        calMaharashtra();
    } else if (strState === ("Punjab")) {
        calPunjab();
    } else if (strState === ("Rajasthan")) {
        calRajasthan();
    } else if (strState === ("Telangana")) {
        calAndhraP();
    } else if (strState === ("Uttar Pradesh")) {
        calUttarP();
    } else if (strState === ("Uttarakhand")) {
        calUttarP();
    } else if (strState === ("West Bengal")) {
        calWestB();
    }
}

function calHaryana() {
    console.log("calHaryana");
    num2 = num1;
    if (num1 > 0) {
        if (num1 > 0) {
            if (num1 < 15001) {
                courtFees = num1 * 2.5 / 100;
            } else if (num1 < 27001) {
                y = num1 - 15000;
                courtFees = 375 + (y * 3.5 / 100);
            } else if (num1 < 39001) {
                y = num1 - 27000;
                courtFees = 795 + (y * 4.5 / 100);
            } else if (num1 < 51001) {
                y = num1 - 39000;
                courtFees = 1335 + (y * 5.5 / 100);
            } else if (num1 < 63001) {
                y = num1 - 51000;
                courtFees = 1995 + (y * 6.5 / 100);
            } else if (num1 < 75001) {
                y = num1 - 63000;
                courtFees = 2775 + (y * 7.5 / 100);
            } else if (num1 < 500001) {
                y = num1 - 75000;
                courtFees = 3675 + (y * 6.5 / 100);
            } else if (num1 < 1000001) {
                y = num1 - 500000;
                courtFees = 31300 + (y * 5.5 / 100);
            } else if (num1 < 2000001) {
                y = num1 - 1000000;
                courtFees = 58800 + (y * 4.5 / 100);
            } else if (num1 < 3000001) {
                y = num1 - 2000000;
                courtFees = 103800 + (y * 3.5 / 100);
            } else if (num1 < 4500001) {
                y = num1 - 3000000;
                courtFees = 138000 + (y * 2.5 / 100);
            } else if (num1 < 6000001) {
                y = num1 - 4500000;
                courtFees = 176300 + (y * 1.5 / 100);
            } else {
                y = num1 - 6000000;
                courtFees = 198800 + (y * 0.5 / 100);
            }
        }
    }
    console.log(courtFees);
    form.remove();
    document.getElementById('para').innerHTML = 'Ad-Valorem Court Fees for vaulation of Rs. ' + num2 + '/- for the State of ' + strState + ' is Rs. ' + courtFees + '/-';
}
function calTN() {
    console.log("calTN")
    num2 = num1;
    let num = 0;
    if (num1 > 0) {
        if (num1 < 5) {
            courtFees = 0.5;
        } else if (num1 < 101) {
            num1 = num1 - 5;
            num1 = num1 / 5;
            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }

            courtFees = 0.5 + (0.5 * num);
        } else if (num1 < 501) {
            num1 = num1 - 100;
            num1 = num1 / 10;
            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 10 + num;

        } else if (num1 < 1001) {
            num1 = num1 - 500;
            num1 = num1 / 10;
            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }

            courtFees = 50 + (1.5 * num);

        } else if (num1 < 5001) {
            num1 = num1 - 1000;
            num1 = num1 / 100;
            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 125 + (12.2 * num);

        } else if (num1 < 10001) {
            num1 = num1 - 5000;
            num1 = num1 / 250;
            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }

            courtFees = 613 + (24.4 * num);

        } else if (num1 < 20001) {
            num1 = num1 - 10000;
            num1 = num1 / 500;
            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }

            courtFees = 1101 + (36.5 * num);
        } else if (num1 < 30001) {
            num1 = num1 - 20000;
            num1 = num1 / 1000;
            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 1831 + (48.8 * num);
        } else if (num1 < 50001) {
            num1 = num1 - 30000;
            num1 = num1 / 2000;
            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 2319 + (48.8 * num);
        } else {
            num1 = num1 - 50000;
            num1 = num1 / 5000;
            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 2563 + (48.8 * num);
        }
    }
    form.remove();
    document.getElementById('para').innerHTML = 'Ad-Valorem Court Fees for vaulation of Rs. ' + num2 + '/- for the State of ' + strState + ' is Rs. ' + courtFees + '/-';
}
function calAndhraP() {
    console.log("calAP");
    num2 = num1;
    let num = 0;
    if (num1 > 0) {
        if (num1 < 101) {
            num1 = num1 / 5;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 0.6 * num;

        } else if (num1 < 501) {
            num1 = num1 - 100;
            num1 = num1 / 10;
            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 8 + (0.80 * num);
        } else if (num1 < 1001) {
            num1 = num1 - 500;
            num1 = num1 / 10;
            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }

            courtFees = 40 + (1.1 * num);
        } else if (num1 < 10001) {
            num1 = num1 - 1000;
            num1 = num1 / 100;
            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }

            courtFees = 111 + (7 * num);

        } else if (num1 < 20001) {
            num1 = num1 - 10000;
            num1 = num1 / 500;
            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }

            courtFees = 174 + (30 * num);

        } else if (num1 < 30001) {
            num1 = num1 - 20000;
            num1 = num1 / 1000;
            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }

            courtFees = 774 + (40 * num);

        } else if (num1 < 50001) {
            num1 = num1 - 30000;
            num1 = num1 / 2000;
            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 1174 + (60 * num);

        } else if (num1 < 100001) {
            num1 = num1 - 50000;
            num1 = num1 / 4000;
            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }

            courtFees = 1774 + (80 * num);

        } else {
            num1 = num1 - 100000;
            num1 = num1 / 10000;
            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }

            courtFees = 2774 + (100 * num);

        }
    }
    form.remove();
    document.getElementById('para').innerHTML = 'Ad-Valorem Court Fees for vaulation of Rs. ' + num2 + '/- for the State of ' + strState + ' is Rs. ' + courtFees + '/-';
}
function calAssam() {
    console.log("calAssam");
    num2 = num1;
    let num = 0;
    if (num1 > 0) {
        if (num1 < 101) {
            num1 = num1 / 5;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 0.55 * num;

        } else if (num1 < 151) {
            num1 = num1 - 100;
            num1 = num1 / 10;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 11 + (1.95 * num);

        } else if (num1 < 1001) {
            num1 = num1 - 150;
            num1 = num1 / 10;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 20.75 + (1.45 * num);

        } else if (num1 < 7501) {
            num1 = num1 - 1000;
            num1 = num1 / 100;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 144 + (8.25 * num);

        } else if (num1 < 10001) {
            num1 = num1 - 7500;
            num1 = num1 / 250;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 680.25 + (16.5 * num);

        } else if (num1 < 20001) {
            num1 = num1 - 10000;
            num1 = num1 / 500;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 845.25 + (24.75 * num);

        } else if (num1 < 50001) {
            num1 = num1 - 20000;
            num1 = num1 / 1000;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 1340.25 + (33 * num);

        } else {
            num1 = num1 - 50000;
            num1 = num1 / 5000;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 2330.25 + (41.25 * num);

        }
    }
    if (courtFees > 11000) {
        courtFees = 11000;
    }
    form.remove();
    document.getElementById('para').innerHTML = 'Ad-Valorem Court Fees for vaulation of Rs. ' + num2 + '/- for the State of ' + strState + ' is Rs. ' + courtFees + '/-';
}

function calBihar() {
    num2 = num1;
    let num = 0;
    if (num1 > 0) {
        if (num1 < 6) {
            courtFees = 0;
        } else if (num1 < 101) {
            num1 = num1 / 5;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = num;


        } else if (num1 < 1001) {
            num1 = num1 - 100;
            num1 = num1 / 10;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }

            courtFees = 20 + (2 * num);
        } else if (num1 < 5001) {
            num1 = num1 - 1000;
            num1 = num1 / 100;
            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 200 + (16 * num);


        } else if (num1 < 10001) {
            num1 = num1 - 5000;
            num1 = num1 / 250;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 840 + (32 * num);

        } else if (num1 < 20001) {
            num1 = num1 - 10000;
            num1 = num1 / 500;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }

            courtFees = 1480 + (48 * num);

        } else if (num1 < 30001) {
            num1 = num1 - 20000;
            num1 = num1 / 1000;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }

            courtFees = 2440 + (64 * num);

        } else if (num1 < 50001) {
            num1 = num1 - 30000;
            num1 = num1 / 2000;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }

            courtFees = 3080 + (64 * num);

        } else if (num1 < 2940001) {
            num1 = num1 - 50000;
            num1 = num1 / 5000;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 3720 + (80 * num);

        } else {
            courtFees = 50000;
        }
    }
    form.remove();
    document.getElementById('para').innerHTML = 'Ad-Valorem Court Fees for vaulation of Rs. ' + num2 + '/- for the State of ' + strState + ' is Rs. ' + courtFees + '/-';
}
function calWestB() {
    num2 = num1;
    let num = 0;
    if (num1 > 0) {
        if (num1 < 1001) {
            num1 = num1 / 100;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = (10 * num);

        } else if (num1 < 7501) {
            num1 = num1 - 1000;
            num1 = num1 / 250;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 100 + (8 * num);
        } else if (num1 < 10001) {
            num1 = num1 - 7500;
            num1 = num1 / 500;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 620 + (16 * num);

        } else if (num1 < 20001) {
            num1 = num1 - 10000;
            num1 = num1 / 10;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 780 + (30 * num);

        } else if (num1 < 50001) {
            num1 = num1 - 20000;
            num1 = num1 / 1000;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }

            courtFees = 1380 + (50 * num);

        } else if (num1 < 100001) {
            num1 = num1 - 50000;
            num1 = num1 / 5000;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 2880 + (350 * num);

        } else if (num1 < 200001) {
            num1 = num1 - 100000;
            num1 = num1 / 5000;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 6380 + (370 * num);

        } else if (num1 < 300001) {
            num1 = num1 - 200000;
            num1 = num1 / 5000;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 13780 + (210 * num);

        } else {
            num1 = num1 - 300000;
            num1 = num1 / 10000;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 17980 + (100 * num);

        }
    }
    if (courtFees > 50000) {
        courtFees = 50000;
    }
    form.remove();
    document.getElementById('para').innerHTML = 'Ad-Valorem Court Fees for vaulation of Rs. ' + num2 + '/- for the State of ' + strState + ' is Rs. ' + courtFees + '/-';
}
function calGujarat() {
    num2 = num1;
    let num = 0;

    if (num1 > 0) {
        if (num1 < 10001) {
            num = num1 / 1000;
            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 100 * num;

        } else if (num1 < 15001) {
            courtFees = 1250;
        } else if (num1 < 20001) {
            courtFees = 1500;
        } else if (num1 < 21001) {
            courtFees = 1525;
        } else if (num1 < 30001) {
            num1 = num1 - 21000;
            num1 = num1 / 1000;


            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 1525 + (75 * num);

        } else if (num1 < 34001) {
            num1 = num1 - 30000;
            num1 = num1 / 2000;


            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 2200 + (175 * num);

        } else if (num1 < 50001) {
            num1 = num1 - 34000;
            num1 = num1 / 2000;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 2500 + (150 * num);

        } else if (num1 < 75001) {
            num1 = num1 - 50000;
            num1 = num1 / 5000;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 3700 + (300 * num);

        } else if (num1 < 100001) {
            num1 = num1 - 75000;
            num1 = num1 / 5000;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 5200 + (150 * num);

        } else if (num1 < 1000001) {
            num1 = num1 - 100000;
            num1 = num1 / 10000;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 5950 + (200 * num);

        } else if (num1 < 2000001) {
            num1 = num1 - 1000000;
            num1 = num1 / 100000;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 23950 + (1200 * num);

        } else if (num1 < 9800001) {
            num1 = num1 - 2000000;
            num1 = num1 / 100000;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 35950 + (500 * num);

        } else {
            courtFees = 75000;
        }
    }
    form.remove();
    document.getElementById('para').innerHTML = 'Ad-Valorem Court Fees for vaulation of Rs. ' + num2 + '/- for the State of ' + strState + ' is Rs. ' + courtFees + '/-';
}
function calHimachalP() {
    num2 = num1;
    let num = 0;


    if (num1 > 0) {
        if (num1 < 101) {
            num1 = num1 / 5;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = num;

        } else if (num1 < 501) {
            num1 = num1 - 100;
            num1 = num1 / 10;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 20 + num;

        } else if (num1 < 1001) {
            num1 = num1 - 500;
            num1 = num1 / 10;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 60 + (2 * num);

        } else if (num1 < 5001) {
            num1 = num1 - 1000;
            num1 = num1 / 100;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 160 + (15 * num);

        } else if (num1 < 10001) {
            num1 = num1 - 5000;
            num1 = num1 / 250;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 760 + (25 * num);

        } else if (num1 < 20001) {
            num1 = num1 - 10000;
            num1 = num1 / 500;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 1260 + (40 * num);

        } else if (num1 < 30001) {
            num1 = num1 - 20000;
            num1 = num1 / 1000;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 2060 + (50 * num);

        } else if (num1 < 50001) {
            num1 = num1 - 30000;
            num1 = num1 / 2000;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 2560 + (50 * num);

        } else {
            num1 = num1 - 50000;
            num1 = num1 / 5000;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 3060 + (50 * num);

        }
    }
    form.remove();
    document.getElementById('para').innerHTML = 'Ad-Valorem Court Fees for vaulation of Rs. ' + num2 + '/- for the State of ' + strState + ' is Rs. ' + courtFees + '/-';
}
function calKarnatka() {
    num2 = num1;
    let num = 0;
    let courtFees2 = 0;
    let y2 = 0;

    if (num2 > 0) {
        if (num2 < 15001) {
            courtFees2 = (num2 * 2.5 / 100);
        } else if (num2 < 75001) {
            y2 = num2 - 15000;
            courtFees2 = 375 + (y2 * 7.5 / 100);
        } else if (num2 < 250001) {
            y2 = num2 - 75000;
            courtFees2 = 4875 + (y2 * 7 / 100);
        } else if (num2 < 500001) {
            y2 = num2 - 250000;
            courtFees2 = 17125 + (y2 * 6.5 / 100);
        } else if (num2 < 750001) {
            y2 = num2 - 500000;
            courtFees2 = 33375 + (y2 * 6 / 100);
        } else if (num2 < 1000001) {
            y2 = num2 - 750000;
            courtFees2 = 48375 + (y2 * 5.5 / 100);
        } else if (num2 < 1500001) {
            y2 = num2 - 1000000;
            courtFees2 = 62125 + (y2 * 5 / 100);
        } else if (num2 < 2000001) {
            y2 = num2 - 1500000;
            courtFees2 = 87125 + (y2 * 4.5 / 100);
        } else if (num2 < 2500001) {
            y2 = num2 - 2000000;
            courtFees2 = 109625 + (y2 * 4 / 100);
        } else if (num2 < 3000001) {
            y2 = num2 - 2500000;
            courtFees2 = 129625 + (y2 * 3.5 / 100);
        } else if (num2 < 4000001) {
            y2 = num2 - 3000000;
            courtFees2 = 147125 + (y2 * 3 / 100);
        } else if (num2 < 5000001) {
            y2 = num2 - 4000000;
            courtFees2 = 177125 + (y2 * 2.5 / 100);
        } else if (num2 < 6000001) {
            y2 = num2 - 5000000;
            courtFees2 = 202125 + (y2 * 2 / 100);
        } else if (num2 < 7000001) {
            y2 = num2 - 6000000;
            courtFees2 = 222125 + (y2 * 1.5 / 100);
        } else if (num2 < 8000001) {
            y2 = num2 - 7000000;
            courtFees2 = 237125 + (y2 / 100);
        } else {
            y2 = num2 - 8000000;
            courtFees2 = 247125 + (y2 / 200);
        }
    }


    form.remove();
    document.getElementById('para').innerHTML = 'Ad-Valorem Court Fees for vaulation of Rs. ' + num2 + '/- for the State of ' + strState + ' is Rs. ' + courtFees2 + '/-';
}
function calKerala() {
    num2 = num1;
    let num = 0;

    if (num1 > 0) {
        if (num1 < 101) {
            courtFees = 4;
        } else if (num1 < 15001) {
            num1 = num1 - 100;
            num1 = num1 / 100;
            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 4 + (4 * num);

        } else if (num1 < 50001) {
            num1 = num1 - 15000;
            num1 = num1 / 100;
            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 600 + (8 * num);

        } else if (num1 < 1000001) {
            num1 = num1 - 50000;
            num1 = num1 / 100;
            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 3400 + (10 * num);

        } else if (num1 < 10000001) {
            num1 = num1 - 1000000;
            num1 = num1 / 100;
            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 98400 + (8 * num);

        } else {
            num1 = num1 - 10000000;
            num1 = num1 / 100;
            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 818400 + (num);

        }
    }
    form.remove();
    document.getElementById('para').innerHTML = 'Ad-Valorem Court Fees for vaulation of Rs. ' + num2 + '/- for the State of ' + strState + ' is Rs. ' + courtFees + '/-';
}
function calMaharashtra() {
    num2 = num1;
    let num = 0;
    if (num1 > 0) {
        if (num1 < 1001) {
            courtFees = 200;
        } else if (num1 < 5001) {
            num1 = num1 - 1000;
            num1 = num1 / 100;
            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 200 + (12 * num);

        } else if (num1 < 10001) {
            num1 = num1 - 5000;
            num1 = num1 / 100;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 680 + (15 * num);

        } else if (num1 < 20001) {
            num1 = num1 - 10000;
            num1 = num1 / 500;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 1430 + (75 * num);

        } else if (num1 < 30001) {
            num1 = num1 - 20000;
            num1 = num1 / 1000;
            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 2930 + (100 * num);

        } else if (num1 < 50001) {
            num1 = num1 - 30000;
            num1 = num1 / 2000;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 3930 + (100 * num);

        } else if (num1 < 100001) {
            num1 = num1 - 50000;
            num1 = num1 / 5000;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 4930 + (150 * num);

        } else if (num1 < 1100001) {
            num1 = num1 - 100000;
            num1 = num1 / 10000;
            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 6430 + (200 * num);


        } else if (num1 < 23900001) {
            num1 = num1 - 1100000;
            num1 = num1 / 100000;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 26430 + (1200 * num);

        } else {
            courtFees = 300000;
        }
    }
    form.remove();
    document.getElementById('para').innerHTML = 'Ad-Valorem Court Fees for vaulation of Rs. ' + num2 + '/- for the State of ' + strState + ' is Rs. ' + courtFees + '/-';
}
function calPunjab() {
    num2 = num1;
    let num = 0;
    let courtFees2;
    let y2;
    if (num2 > 0) {
        if (num2 < 10001) {
            courtFees2 = (num2 * 2.5 / 100);
        } else if (num2 < 20001) {
            y2 = num2 - 10000;
            courtFees2 = 250 + (y2 * 3.5 / 100);
        } else if (num2 < 30001) {
            y2 = num2 - 20000;
            courtFees2 = 600 + (y2 * 4.5 / 100);
        } else if (num2 < 40001) {
            y2 = num2 - 30000;
            courtFees2 = 1050 + (y2 * 5.5 / 100);
        } else if (num2 < 50001) {
            y2 = num2 - 40000;
            courtFees2 = 1600 + (y2 * 6.5 / 100);
        } else if (num2 < 60001) {
            y2 = num2 - 50000;
            courtFees2 = 2250 + (y2 * 7.5 / 100);
        } else if (num2 < 75001) {
            y2 = num2 - 60000;
            courtFees2 = 3000 + (y2 * 6.5 / 100);
        } else if (num2 < 100001) {
            y2 = num2 - 75000;
            courtFees2 = 3975 + (y2 * 5.5 / 100);
        } else if (num2 < 200001) {
            y2 = num2 - 100000;
            courtFees2 = 5350 + (y2 * 3.5 / 100);
        } else if (num2 < 300001) {
            y2 = num2 - 200000;
            courtFees2 = 8850 + (y2 * 2.25 / 100);
        } else {
            y2 = num2 - 300000;
            courtFees2 = 11100 + (y2 * 2.25 / 100);
        }
    }
    form.remove();
    document.getElementById('para').innerHTML = 'Ad-Valorem Court Fees for vaulation of Rs. ' + num2 + '/- for the State of ' + strState + ' is Rs. ' + courtFees2 + '/-';
}
function calRajasthan() {
    num2 = num1;
    let num = 0;
    let courtFees2;
    let y2;
    if (num2 > 0) {
        if (num2 < 15001) {
            courtFees2 = (num2 * 2.5 / 100);
        } else if (num2 < 75001) {
            y2 = num2 - 15000;
            courtFees2 = 375 + (y2 * 7.5 / 100);
        } else if (num2 < 250001) {
            y2 = num2 - 75000;
            courtFees2 = 4875 + (y2 * 7 / 100);
        } else if (num2 < 500001) {
            y2 = num2 - 250000;
            courtFees2 = 17125 + (y2 * 6.5 / 100);
        } else if (num2 < 750001) {
            y2 = num2 - 500000;
            courtFees2 = 33375 + (y2 * 6 / 100);
        } else if (num2 < 1000001) {
            y2 = num2 - 750000;
            courtFees2 = 48375 + (y2 * 5.5 / 100);
        } else if (num2 < 1500001) {
            y2 = num2 - 1000000;
            courtFees2 = 62125 + (y2 * 5 / 100);
        } else if (num2 < 2000001) {
            y2 = num2 - 1500000;
            courtFees2 = 87125 + (y2 * 4.5 / 100);
        } else if (num2 < 2500001) {
            y2 = num2 - 2000000;
            courtFees2 = 109625 + (y2 * 4 / 100);
        } else if (num2 < 3000001) {
            y2 = num2 - 2500000;
            courtFees2 = 129625 + (y2 * 3.5 / 100);
        } else if (num2 < 4000001) {
            y2 = num2 - 3000000;
            courtFees2 = 147125 + (y2 * 3 / 100);
        } else if (num2 < 10000001) {
            y2 = num2 - 4000000;
            courtFees2 = 177125 + (y2 * 2.5 / 100);
        } else if (num2 < 15000001) {
            y2 = num2 - 10000000;
            courtFees2 = 327125 + (y2 * 2 / 100);
        } else if (num2 < 20000001) {
            y2 = num2 - 15000000;
            courtFees2 = 427125 + (y2 * 1.5 / 100);
        } else if (num2 < 30000001) {
            y2 = num2 - 20000000;
            courtFees2 = 502125 + (y2 / 100);
        } else {
            y2 = num2 - 30000000;
            courtFees2 = 602125 + (y2 / 200);
        }
    }
    form.remove();
    document.getElementById('para').innerHTML = 'Ad-Valorem Court Fees for vaulation of Rs. ' + num2 + '/- for the State of ' + strState + ' is Rs. ' + courtFees2 + '/-';
}
function calUttarP() {
    num2 = num1;
    let num = 0;
    if (num1 > 0) {
        if (num1 < 101) {
            num1 = num1 / 5;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 0.5 * num;


        } else if (num1 < 301) {
            num1 = num1 - 100;
            num1 = num1 / 10;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 10 + (1.25 * num);


        } else if (num1 < 501) {
            num1 = num1 - 300;
            num1 = num1 / 10;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 35 + (1.5 * num);


        } else if (num1 < 1001) {
            num1 = num1 - 500;
            num1 = num1 / 10;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 65 + (2.25 * num);

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }

        } else if (num1 < 5001) {
            num1 = num1 - 1000;
            num1 = num1 / 100;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 177.5 + (12 * num);

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }

        } else if (num1 < 10001) {
            num1 = num1 - 5000;
            num1 = num1 / 200;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 657.5 + (20 * num);

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }

        } else {
            num1 = num1 - 10000;
            num1 = num1 / 500;

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }
            courtFees = 1157.5 + (37.5 * num);

            if (Number.isInteger(num1)) {
                num = num1;
            } else {
                num = Math.floor(num1) + 1;
            }

        }
    }
    form.remove();
    document.getElementById('para').innerHTML = 'Ad-Valorem Court Fees for vaulation of Rs. ' + num2 + '/- for the State of ' + strState + ' is Rs. ' + courtFees + '/-';
}