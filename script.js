/* ==========================================================================
   Hisab Calculator - All-in-One Financial Calculator Core Script
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    /* --------------------------------------------------------------------------
       1. Utility Helpers & Formatting
       -------------------------------------------------------------------------- */
    const formatINR = (value) => {
        if (isNaN(value) || value === null) return '₹ 0.00';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    };

    const showToast = (message) => {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    };

    const copyToClipboard = (text, successMsg = 'Summary copied to clipboard!') => {
        navigator.clipboard.writeText(text).then(() => {
            showToast(successMsg);
        }).catch(err => {
            showToast('Failed to copy to clipboard');
        });
    };

    /* --------------------------------------------------------------------------
       2. Application Navigation & Header State
       -------------------------------------------------------------------------- */
    const navItems = document.querySelectorAll('.nav-item');
    const calcPanels = document.querySelectorAll('.calculator-panel');
    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');
    const sidebar = document.getElementById('sidebar');
    const mobileToggleBtn = document.getElementById('mobileToggleBtn');
    const mobileCloseBtn = document.getElementById('mobileCloseBtn');

    const metaHeadings = {
        gst: {
            title: 'GST Calculator',
            subtitle: 'Calculate Goods and Services Tax inclusive & exclusive amounts'
        },
        emi: {
            title: 'EMI Calculator',
            subtitle: 'Calculate Equated Monthly Installments and loan interest breakdown'
        },
        fd: {
            title: 'FD Calculator',
            subtitle: 'Calculate Fixed Deposit maturity amount and compound interest returns'
        },
        sip: {
            title: 'SIP Calculator',
            subtitle: 'Calculate wealth growth for Systematic Investment Plans with optional step-up'
        },
        rd: {
            title: 'RD Calculator',
            subtitle: 'Calculate Recurring Deposit interest and estimated maturity value'
        },
        gratuity: {
            title: 'Gratuity Calculator',
            subtitle: 'Estimate retirement gratuity payout based on Last Drawn Salary and service tenure'
        },
        normal: {
            title: 'Normal Calculator',
            subtitle: 'Standard math calculator for basic calculations'
        }
    };

    const switchTab = (tabName) => {
        navItems.forEach(item => {
            if (item.dataset.tab === tabName) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        calcPanels.forEach(panel => {
            if (panel.id === `panel-${tabName}`) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });

        if (metaHeadings[tabName]) {
            pageTitle.textContent = metaHeadings[tabName].title;
            pageSubtitle.textContent = metaHeadings[tabName].subtitle;
        }

        // Close mobile drawer if open
        sidebar.classList.remove('mobile-open');

        // Trigger chart resizes if switching to chart tabs
        if (tabName === 'emi' && emiChart) emiChart.resize();
        if (tabName === 'fd' && fdChart) fdChart.resize();
        if (tabName === 'sip' && sipChart) sipChart.resize();
        if (tabName === 'rd' && rdChart) rdChart.resize();
    };

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            switchTab(item.dataset.tab);
        });
    });

    mobileToggleBtn.addEventListener('click', () => {
        sidebar.classList.add('mobile-open');
    });

    mobileCloseBtn.addEventListener('click', () => {
        sidebar.classList.remove('mobile-open');
    });

    /* --------------------------------------------------------------------------
       3. Theme Handler (Strict Light Mode)
       -------------------------------------------------------------------------- */
    document.documentElement.setAttribute('data-theme', 'light');

    /* --------------------------------------------------------------------------
       4. GST Calculator Module
       -------------------------------------------------------------------------- */
    const gstAmountInput = document.getElementById('gst-amount');
    const gstAmountError = document.getElementById('gst-amount-error');
    const gstCustomRateInput = document.getElementById('gst-custom-rate');
    const gstChipBtns = document.querySelectorAll('#gst-rate-chips .chip-btn');
    const gstModeRadios = document.querySelectorAll('input[name="gst-mode"]');
    const gstCalculateBtn = document.getElementById('gst-calculate-btn');
    const gstResetBtn = document.getElementById('gst-reset');
    const gstCopyBtn = document.getElementById('gst-copy');

    // Outputs
    const gstResFinal = document.getElementById('gst-res-final');
    const gstResOriginal = document.getElementById('gst-res-original');
    const gstResCgst = document.getElementById('gst-res-cgst');
    const gstResSgst = document.getElementById('gst-res-sgst');
    const gstResTax = document.getElementById('gst-res-tax');
    const gstCgstRate = document.getElementById('gst-cgst-rate');
    const gstSgstRate = document.getElementById('gst-sgst-rate');
    const gstExplanation = document.getElementById('gst-explanation');

    let currentGstRate = 18;

    const calculateGST = () => {
        const amount = parseFloat(gstAmountInput.value);
        const rate = parseFloat(gstCustomRateInput.value) || currentGstRate;
        const mode = document.querySelector('input[name="gst-mode"]:checked').value;

        if (isNaN(amount) || amount <= 0) {
            gstAmountError.textContent = 'Please enter a valid positive amount';
            return;
        } else {
            gstAmountError.textContent = '';
        }

        let originalAmount = 0;
        let taxAmount = 0;
        let finalAmount = 0;

        if (mode === 'add') {
            // Exclusive GST: Amount is Base
            originalAmount = amount;
            taxAmount = amount * (rate / 100);
            finalAmount = amount + taxAmount;
            gstExplanation.textContent = `Exclusive Mode: ${rate}% GST (${formatINR(taxAmount)}) is added to the base amount ${formatINR(originalAmount)}.`;
        } else {
            // Inclusive GST: Amount is Total
            finalAmount = amount;
            originalAmount = amount / (1 + (rate / 100));
            taxAmount = amount - originalAmount;
            gstExplanation.textContent = `Inclusive Mode: Base amount is ${formatINR(originalAmount)} + ${rate}% GST (${formatINR(taxAmount)}) = Total ${formatINR(finalAmount)}.`;
        }

        const halfRate = (rate / 2).toFixed(2).replace(/\.00$/, '');
        const cgstAmount = taxAmount / 2;
        const sgstAmount = taxAmount / 2;

        gstResOriginal.textContent = formatINR(originalAmount);
        gstResCgst.textContent = formatINR(cgstAmount);
        gstResSgst.textContent = formatINR(sgstAmount);
        gstResTax.textContent = formatINR(taxAmount);
        gstResFinal.textContent = formatINR(finalAmount);

        gstCgstRate.textContent = halfRate;
        gstSgstRate.textContent = halfRate;
    };

    // Rate Chip Click Handlers
    gstChipBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            gstChipBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentGstRate = parseFloat(btn.dataset.rate);
            gstCustomRateInput.value = currentGstRate;
            calculateGST();
        });
    });

    gstCustomRateInput.addEventListener('input', () => {
        const val = parseFloat(gstCustomRateInput.value);
        gstChipBtns.forEach(b => {
            if (parseFloat(b.dataset.rate) === val) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });
        calculateGST();
    });

    gstAmountInput.addEventListener('input', calculateGST);
    gstModeRadios.forEach(r => r.addEventListener('change', calculateGST));
    gstCalculateBtn.addEventListener('click', calculateGST);

    gstResetBtn.addEventListener('click', () => {
        gstAmountInput.value = '10000';
        gstCustomRateInput.value = '18';
        currentGstRate = 18;
        gstChipBtns.forEach(b => {
            b.classList.toggle('active', b.dataset.rate === '18');
        });
        document.getElementById('gst-add').checked = true;
        calculateGST();
    });

    gstCopyBtn.addEventListener('click', () => {
        const summary = `🧾 GST Calculation Summary:\n` +
            `• Base Amount: ${gstResOriginal.textContent}\n` +
            `• CGST (${gstCgstRate.textContent}%): ${gstResCgst.textContent}\n` +
            `• SGST (${gstSgstRate.textContent}%): ${gstResSgst.textContent}\n` +
            `• Total Tax: ${gstResTax.textContent}\n` +
            `• Final Amount: ${gstResFinal.textContent}`;
        copyToClipboard(summary);
    });

    /* --------------------------------------------------------------------------
       5. EMI Calculator Module & Chart
       -------------------------------------------------------------------------- */
    const emiAmountInput = document.getElementById('emi-amount');
    const emiAmountSlider = document.getElementById('emi-amount-slider');
    const emiAmountBadge = document.getElementById('emi-amount-badge');

    const emiRateInput = document.getElementById('emi-rate');
    const emiRateSlider = document.getElementById('emi-rate-slider');
    const emiRateBadge = document.getElementById('emi-rate-badge');

    const emiTenureInput = document.getElementById('emi-tenure');
    const emiTenureSlider = document.getElementById('emi-tenure-slider');
    const emiTenureSuffix = document.getElementById('emi-tenure-suffix');
    const emiUnitYears = document.getElementById('emi-unit-years');
    const emiUnitMonths = document.getElementById('emi-unit-months');

    const emiCalculateBtn = document.getElementById('emi-calculate-btn');
    const emiResetBtn = document.getElementById('emi-reset');
    const emiCopyBtn = document.getElementById('emi-copy');

    // Outputs
    const emiResEmi = document.getElementById('emi-res-emi');
    const emiResPrincipal = document.getElementById('emi-res-principal');
    const emiResInterest = document.getElementById('emi-res-interest');
    const emiResTotal = document.getElementById('emi-res-total');

    let emiTenureUnit = 'years';
    let emiChart = null;

    const initEMIChart = () => {
        const ctx = document.getElementById('emiChart').getContext('2d');
        emiChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Principal Amount', 'Total Interest'],
                datasets: [{
                    data: [500000, 115497],
                    backgroundColor: ['#6366f1', '#f59e0b'],
                    borderWidth: 0,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ` ${context.label}: ${formatINR(context.raw)}`;
                            }
                        }
                    }
                },
                cutout: '72%'
            }
        });
    };

    const calculateEMI = () => {
        const P = parseFloat(emiAmountInput.value) || 0;
        const annualRate = parseFloat(emiRateInput.value) || 0;
        let tenure = parseFloat(emiTenureInput.value) || 0;

        if (P <= 0 || tenure <= 0) return;

        const N = (emiTenureUnit === 'years') ? tenure * 12 : tenure;
        const R = annualRate / (12 * 100);

        let emi = 0;
        let totalAmount = 0;
        let totalInterest = 0;

        if (R === 0) {
            emi = P / N;
            totalAmount = P;
            totalInterest = 0;
        } else {
            const mathPow = Math.pow(1 + R, N);
            emi = (P * R * mathPow) / (mathPow - 1);
            totalAmount = emi * N;
            totalInterest = totalAmount - P;
        }

        emiResEmi.textContent = formatINR(emi);
        emiResPrincipal.textContent = formatINR(P);
        emiResInterest.textContent = formatINR(totalInterest);
        emiResTotal.textContent = formatINR(totalAmount);

        // Update Slider badges
        emiAmountBadge.textContent = formatINR(P).split('.')[0];
        emiRateBadge.textContent = `${annualRate}%`;

        // Update Doughnut Chart
        if (emiChart) {
            emiChart.data.datasets[0].data = [P, Math.max(0, totalInterest)];
            emiChart.update();
        }
    };

    // Range Sync Helpers
    const bindSyncInputSlider = (inputEl, sliderEl, callback) => {
        inputEl.addEventListener('input', () => {
            sliderEl.value = inputEl.value;
            callback();
        });
        sliderEl.addEventListener('input', () => {
            inputEl.value = sliderEl.value;
            callback();
        });
    };

    bindSyncInputSlider(emiAmountInput, emiAmountSlider, calculateEMI);
    bindSyncInputSlider(emiRateInput, emiRateSlider, calculateEMI);
    bindSyncInputSlider(emiTenureInput, emiTenureSlider, calculateEMI);

    emiUnitYears.addEventListener('click', () => {
        if (emiTenureUnit === 'years') return;
        emiTenureUnit = 'years';
        emiUnitYears.classList.add('active');
        emiUnitMonths.classList.remove('active');
        emiTenureSuffix.textContent = 'Years';
        emiTenureInput.value = '5';
        emiTenureSlider.max = '30';
        emiTenureSlider.value = '5';
        calculateEMI();
    });

    emiUnitMonths.addEventListener('click', () => {
        if (emiTenureUnit === 'months') return;
        emiTenureUnit = 'months';
        emiUnitMonths.classList.add('active');
        emiUnitYears.classList.remove('active');
        emiTenureSuffix.textContent = 'Months';
        emiTenureInput.value = '60';
        emiTenureSlider.max = '360';
        emiTenureSlider.value = '60';
        calculateEMI();
    });

    emiCalculateBtn.addEventListener('click', calculateEMI);

    emiResetBtn.addEventListener('click', () => {
        emiAmountInput.value = '500000';
        emiAmountSlider.value = '500000';
        emiRateInput.value = '8.5';
        emiRateSlider.value = '8.5';
        emiUnitYears.click();
    });

    emiCopyBtn.addEventListener('click', () => {
        const summary = `💰 EMI Loan Calculation Summary:\n` +
            `• Loan Amount: ${emiResPrincipal.textContent}\n` +
            `• Interest Rate: ${emiRateInput.value}% p.a.\n` +
            `• Tenure: ${emiTenureInput.value} ${emiTenureSuffix.textContent}\n` +
            `• Monthly EMI: ${emiResEmi.textContent}\n` +
            `• Total Interest: ${emiResInterest.textContent}\n` +
            `• Total Payable: ${emiResTotal.textContent}`;
        copyToClipboard(summary);
    });

    /* --------------------------------------------------------------------------
       6. FD Calculator Module & Chart
       -------------------------------------------------------------------------- */
    const fdAmountInput = document.getElementById('fd-amount');
    const fdAmountSlider = document.getElementById('fd-amount-slider');
    const fdAmountBadge = document.getElementById('fd-amount-badge');

    const fdRateInput = document.getElementById('fd-rate');
    const fdRateSlider = document.getElementById('fd-rate-slider');
    const fdRateBadge = document.getElementById('fd-rate-badge');

    const fdTenureInput = document.getElementById('fd-tenure');
    const fdTenureSlider = document.getElementById('fd-tenure-slider');
    const fdTenureSuffix = document.getElementById('fd-tenure-suffix');
    const fdUnitYears = document.getElementById('fd-unit-years');
    const fdUnitMonths = document.getElementById('fd-unit-months');
    const fdFreqSelect = document.getElementById('fd-freq');

    const fdCalculateBtn = document.getElementById('fd-calculate-btn');
    const fdResetBtn = document.getElementById('fd-reset');
    const fdCopyBtn = document.getElementById('fd-copy');

    // Outputs
    const fdResMaturity = document.getElementById('fd-res-maturity');
    const fdResPrincipal = document.getElementById('fd-res-principal');
    const fdResInterest = document.getElementById('fd-res-interest');
    const fdResTotal = document.getElementById('fd-res-total');

    let fdTenureUnit = 'years';
    let fdChart = null;

    const initFDChart = () => {
        const ctx = document.getElementById('fdChart').getContext('2d');
        fdChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Principal Invested', 'Interest Earned'],
                datasets: [{
                    data: [100000, 23144],
                    backgroundColor: ['#6366f1', '#10b981'],
                    borderWidth: 0,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ` ${context.label}: ${formatINR(context.raw)}`;
                            }
                        }
                    }
                },
                cutout: '72%'
            }
        });
    };

    const calculateFD = () => {
        const P = parseFloat(fdAmountInput.value) || 0;
        const r = parseFloat(fdRateInput.value) || 0;
        const tenure = parseFloat(fdTenureInput.value) || 0;
        const n = parseFloat(fdFreqSelect.value) || 4;

        if (P <= 0 || tenure <= 0) return;

        const tYears = (fdTenureUnit === 'months') ? tenure / 12 : tenure;

        // Compound Interest Formula: A = P * (1 + r / (n * 100))^(n * t)
        const compoundRate = 1 + (r / (n * 100));
        const maturityValue = P * Math.pow(compoundRate, n * tYears);
        const interestEarned = maturityValue - P;

        fdResMaturity.textContent = formatINR(maturityValue);
        fdResPrincipal.textContent = formatINR(P);
        fdResInterest.textContent = formatINR(interestEarned);
        fdResTotal.textContent = formatINR(maturityValue);

        fdAmountBadge.textContent = formatINR(P).split('.')[0];
        fdRateBadge.textContent = `${r}%`;

        // Update Doughnut Chart
        if (fdChart) {
            fdChart.data.datasets[0].data = [P, Math.max(0, interestEarned)];
            fdChart.update();
        }
    };

    bindSyncInputSlider(fdAmountInput, fdAmountSlider, calculateFD);
    bindSyncInputSlider(fdRateInput, fdRateSlider, calculateFD);
    bindSyncInputSlider(fdTenureInput, fdTenureSlider, calculateFD);
    fdFreqSelect.addEventListener('change', calculateFD);

    fdUnitYears.addEventListener('click', () => {
        if (fdTenureUnit === 'years') return;
        fdTenureUnit = 'years';
        fdUnitYears.classList.add('active');
        fdUnitMonths.classList.remove('active');
        fdTenureSuffix.textContent = 'Years';
        fdTenureInput.value = '3';
        fdTenureSlider.max = '25';
        fdTenureSlider.value = '3';
        calculateFD();
    });

    fdUnitMonths.addEventListener('click', () => {
        if (fdTenureUnit === 'months') return;
        fdTenureUnit = 'months';
        fdUnitMonths.classList.add('active');
        fdUnitYears.classList.remove('active');
        fdTenureSuffix.textContent = 'Months';
        fdTenureInput.value = '36';
        fdTenureSlider.max = '300';
        fdTenureSlider.value = '36';
        calculateFD();
    });

    fdCalculateBtn.addEventListener('click', calculateFD);

    fdResetBtn.addEventListener('click', () => {
        fdAmountInput.value = '100000';
        fdAmountSlider.value = '100000';
        fdRateInput.value = '7.0';
        fdRateSlider.value = '7.0';
        fdFreqSelect.value = '4';
        fdUnitYears.click();
    });

    fdCopyBtn.addEventListener('click', () => {
        const summary = `🏦 FD Investment Summary:\n` +
            `• Principal Invested: ${fdResPrincipal.textContent}\n` +
            `• Interest Rate: ${fdRateInput.value}% p.a.\n` +
            `• Tenure: ${fdTenureInput.value} ${fdTenureSuffix.textContent}\n` +
            `• Compounding: ${fdFreqSelect.options[fdFreqSelect.selectedIndex].text.split(' ')[0]}\n` +
            `• Interest Earned: ${fdResInterest.textContent}\n` +
            `• Total Maturity Amount: ${fdResMaturity.textContent}`;
        copyToClipboard(summary);
    });

    const updateChartThemes = (theme) => {
        if (emiChart) emiChart.update();
        if (fdChart) fdChart.update();
        if (sipChart) sipChart.update();
        if (rdChart) rdChart.update();
    };

    /* --------------------------------------------------------------------------
       6.1. SIP Calculator Module & Chart
       -------------------------------------------------------------------------- */
    const sipAmountInput = document.getElementById('sip-amount');
    const sipAmountSlider = document.getElementById('sip-amount-slider');
    const sipAmountBadge = document.getElementById('sip-amount-badge');

    const sipRateInput = document.getElementById('sip-rate');
    const sipRateSlider = document.getElementById('sip-rate-slider');
    const sipRateBadge = document.getElementById('sip-rate-badge');

    const sipTenureInput = document.getElementById('sip-tenure');
    const sipTenureSlider = document.getElementById('sip-tenure-slider');
    const sipTenureBadge = document.getElementById('sip-tenure-badge');

    const sipStepupToggle = document.getElementById('sip-stepup-toggle');
    const sipStepupContainer = document.getElementById('sip-stepup-container');
    const sipStepupPercentInput = document.getElementById('sip-stepup-percent');

    const sipCalculateBtn = document.getElementById('sip-calculate-btn');
    const sipResetBtn = document.getElementById('sip-reset');
    const sipCopyBtn = document.getElementById('sip-copy');

    // Outputs
    const sipResFinal = document.getElementById('sip-res-final');
    const sipResInvested = document.getElementById('sip-res-invested');
    const sipResReturns = document.getElementById('sip-res-returns');
    const sipResTotal = document.getElementById('sip-res-total');

    let sipChart = null;

    const initSIPChart = () => {
        const ctx = document.getElementById('sipChart').getContext('2d');
        sipChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Invested Amount', 'Estimated Returns'],
                datasets: [{
                    data: [600000, 561695],
                    backgroundColor: ['#6366f1', '#10b981'],
                    borderWidth: 0,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ` ${context.label}: ${formatINR(context.raw)}`;
                            }
                        }
                    }
                },
                cutout: '72%'
            }
        });
    };

    const calculateSIP = () => {
        const P = parseFloat(sipAmountInput.value) || 0;
        const r = parseFloat(sipRateInput.value) || 0;
        const years = parseFloat(sipTenureInput.value) || 0;
        const isStepup = sipStepupToggle.checked;
        const stepupPercent = parseFloat(sipStepupPercentInput.value) || 0;

        if (P <= 0 || years <= 0) return;

        let totalInvested = 0;
        let finalValue = 0;
        let estimatedReturns = 0;

        if (!isStepup || stepupPercent <= 0) {
            // Standard SIP Formula
            const i = r / (12 * 100);
            const n = years * 12;
            totalInvested = P * n;
            finalValue = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
            estimatedReturns = finalValue - totalInvested;
        } else {
            // Step-Up SIP Calculation (Compounded Monthly with Annual Step-Up)
            const monthlyRate = r / (12 * 100);
            let currentMonthlyInstallment = P;
            currentValue = 0;

            for (let yr = 1; yr <= years; yr++) {
                for (let m = 1; m <= 12; m++) {
                    currentValue = (currentValue + currentMonthlyInstallment) * (1 + monthlyRate);
                    totalInvested += currentMonthlyInstallment;
                }
                currentMonthlyInstallment += currentMonthlyInstallment * (stepupPercent / 100);
            }
            finalValue = currentValue;
            estimatedReturns = finalValue - totalInvested;
        }

        sipResFinal.textContent = formatINR(finalValue);
        sipResInvested.textContent = formatINR(totalInvested);
        sipResReturns.textContent = formatINR(estimatedReturns);
        sipResTotal.textContent = formatINR(finalValue);

        sipAmountBadge.textContent = formatINR(P).split('.')[0];
        sipRateBadge.textContent = `${r}%`;
        sipTenureBadge.textContent = `${years} Years`;

        if (sipChart) {
            sipChart.data.datasets[0].data = [totalInvested, Math.max(0, estimatedReturns)];
            sipChart.update();
        }
    };

    bindSyncInputSlider(sipAmountInput, sipAmountSlider, calculateSIP);
    bindSyncInputSlider(sipRateInput, sipRateSlider, calculateSIP);
    bindSyncInputSlider(sipTenureInput, sipTenureSlider, calculateSIP);

    sipStepupToggle.addEventListener('change', () => {
        sipStepupContainer.style.display = sipStepupToggle.checked ? 'block' : 'none';
        calculateSIP();
    });

    sipStepupPercentInput.addEventListener('input', calculateSIP);
    sipCalculateBtn.addEventListener('click', calculateSIP);

    sipResetBtn.addEventListener('click', () => {
        sipAmountInput.value = '5000';
        sipAmountSlider.value = '5000';
        sipRateInput.value = '12.0';
        sipRateSlider.value = '12.0';
        sipTenureInput.value = '10';
        sipTenureSlider.value = '10';
        sipStepupToggle.checked = false;
        sipStepupContainer.style.display = 'none';
        sipStepupPercentInput.value = '10';
        calculateSIP();
    });

    sipCopyBtn.addEventListener('click', () => {
        const summary = `📈 SIP Investment Summary:\n` +
            `• Monthly Installment: ${formatINR(parseFloat(sipAmountInput.value))}\n` +
            `• Expected Return: ${sipRateInput.value}% p.a.\n` +
            `• Investment Duration: ${sipTenureInput.value} Years\n` +
            `• Step-up SIP: ${sipStepupToggle.checked ? sipStepupPercentInput.value + '% annual increase' : 'Disabled'}\n` +
            `• Total Invested: ${sipResInvested.textContent}\n` +
            `• Estimated Returns: ${sipResReturns.textContent}\n` +
            `• Final Portfolio Value: ${sipResFinal.textContent}`;
        copyToClipboard(summary);
    });

    /* --------------------------------------------------------------------------
       6.2. RD (Recurring Deposit) Calculator Module & Chart
       -------------------------------------------------------------------------- */
    const rdAmountInput = document.getElementById('rd-amount');
    const rdAmountSlider = document.getElementById('rd-amount-slider');
    const rdAmountBadge = document.getElementById('rd-amount-badge');

    const rdRateInput = document.getElementById('rd-rate');
    const rdRateSlider = document.getElementById('rd-rate-slider');
    const rdRateBadge = document.getElementById('rd-rate-badge');

    const rdTenureInput = document.getElementById('rd-tenure');
    const rdTenureSlider = document.getElementById('rd-tenure-slider');
    const rdTenureSuffix = document.getElementById('rd-tenure-suffix');
    const rdUnitYears = document.getElementById('rd-unit-years');
    const rdUnitMonths = document.getElementById('rd-unit-months');
    const rdFreqSelect = document.getElementById('rd-freq');

    const rdCalculateBtn = document.getElementById('rd-calculate-btn');
    const rdResetBtn = document.getElementById('rd-reset');
    const rdCopyBtn = document.getElementById('rd-copy');

    // Outputs
    const rdResMaturity = document.getElementById('rd-res-maturity');
    const rdResDeposited = document.getElementById('rd-res-deposited');
    const rdResInterest = document.getElementById('rd-res-interest');
    const rdResTotal = document.getElementById('rd-res-total');

    let rdTenureUnit = 'months';
    let rdChart = null;

    const initRDChart = () => {
        const ctx = document.getElementById('rdChart').getContext('2d');
        rdChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Total Deposits', 'Interest Earned'],
                datasets: [{
                    data: [60000, 2481],
                    backgroundColor: ['#6366f1', '#8b5cf6'],
                    borderWidth: 0,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ` ${context.label}: ${formatINR(context.raw)}`;
                            }
                        }
                    }
                },
                cutout: '72%'
            }
        });
    };

    const calculateRD = () => {
        const P = parseFloat(rdAmountInput.value) || 0;
        const r = parseFloat(rdRateInput.value) || 0;
        const tenure = parseFloat(rdTenureInput.value) || 0;
        const n = parseFloat(rdFreqSelect.value) || 4;

        if (P <= 0 || tenure <= 0) return;

        const M = (rdTenureUnit === 'years') ? tenure * 12 : tenure;
        let totalMaturity = 0;

        // Sum maturity value for each monthly deposit
        for (let k = 1; k <= M; k++) {
            const tInYears = (M - k + 1) / 12;
            const depositMaturity = P * Math.pow(1 + r / (n * 100), n * tInYears);
            totalMaturity += depositMaturity;
        }

        const totalDeposited = P * M;
        const interestEarned = totalMaturity - totalDeposited;

        rdResMaturity.textContent = formatINR(totalMaturity);
        rdResDeposited.textContent = formatINR(totalDeposited);
        rdResInterest.textContent = formatINR(interestEarned);
        rdResTotal.textContent = formatINR(totalMaturity);

        rdAmountBadge.textContent = formatINR(P).split('.')[0];
        rdRateBadge.textContent = `${r}%`;

        if (rdChart) {
            rdChart.data.datasets[0].data = [totalDeposited, Math.max(0, interestEarned)];
            rdChart.update();
        }
    };

    bindSyncInputSlider(rdAmountInput, rdAmountSlider, calculateRD);
    bindSyncInputSlider(rdRateInput, rdRateSlider, calculateRD);
    bindSyncInputSlider(rdTenureInput, rdTenureSlider, calculateRD);
    rdFreqSelect.addEventListener('change', calculateRD);

    rdUnitYears.addEventListener('click', () => {
        if (rdTenureUnit === 'years') return;
        rdTenureUnit = 'years';
        rdUnitYears.classList.add('active');
        rdUnitMonths.classList.remove('active');
        rdTenureSuffix.textContent = 'Years';
        rdTenureInput.value = '1';
        rdTenureSlider.max = '10';
        rdTenureSlider.value = '1';
        calculateRD();
    });

    rdUnitMonths.addEventListener('click', () => {
        if (rdTenureUnit === 'months') return;
        rdTenureUnit = 'months';
        rdUnitMonths.classList.add('active');
        rdUnitYears.classList.remove('active');
        rdTenureSuffix.textContent = 'Months';
        rdTenureInput.value = '12';
        rdTenureSlider.max = '120';
        rdTenureSlider.value = '12';
        calculateRD();
    });

    rdCalculateBtn.addEventListener('click', calculateRD);

    rdResetBtn.addEventListener('click', () => {
        rdAmountInput.value = '5000';
        rdAmountSlider.value = '5000';
        rdRateInput.value = '7.5';
        rdRateSlider.value = '7.5';
        rdFreqSelect.value = '4';
        rdUnitMonths.click();
    });

    rdCopyBtn.addEventListener('click', () => {
        const summary = `🔄 RD Calculation Summary:\n` +
            `• Monthly Deposit: ${formatINR(parseFloat(rdAmountInput.value))}\n` +
            `• Interest Rate: ${rdRateInput.value}% p.a.\n` +
            `• Tenure: ${rdTenureInput.value} ${rdTenureSuffix.textContent}\n` +
            `• Compounding: ${rdFreqSelect.options[rdFreqSelect.selectedIndex].text.split(' ')[0]}\n` +
            `• Total Deposited: ${rdResDeposited.textContent}\n` +
            `• Estimated Interest: ${rdResInterest.textContent}\n` +
            `• Maturity Amount: ${rdResMaturity.textContent}`;
        copyToClipboard(summary);
    });

    /* --------------------------------------------------------------------------
       6.3. Gratuity Calculator Module
       -------------------------------------------------------------------------- */
    const gratuityBasicInput = document.getElementById('gratuity-basic');
    const gratuityDaInput = document.getElementById('gratuity-da');
    const gratuityYearsInput = document.getElementById('gratuity-years');
    const gratuityYearsSlider = document.getElementById('gratuity-years-slider');
    const gratuityYearsBadge = document.getElementById('gratuity-years-badge');

    const gratuityCalculateBtn = document.getElementById('gratuity-calculate-btn');
    const gratuityResetBtn = document.getElementById('gratuity-reset');
    const gratuityCopyBtn = document.getElementById('gratuity-copy');

    // Outputs
    const gratuityResAmount = document.getElementById('gratuity-res-amount');
    const gratuityResBasic = document.getElementById('gratuity-res-basic');
    const gratuityResDa = document.getElementById('gratuity-res-da');
    const gratuityResLastSalary = document.getElementById('gratuity-res-last-salary');
    const gratuityResYears = document.getElementById('gratuity-res-years');
    const gratuityInfoText = document.getElementById('gratuity-info-text');

    const calculateGratuity = () => {
        const basic = parseFloat(gratuityBasicInput.value) || 0;
        const da = parseFloat(gratuityDaInput.value) || 0;
        const years = parseFloat(gratuityYearsInput.value) || 0;

        const lastDrawnSalary = basic + da;
        
        // Standard Gratuity Formula: (Last Drawn Salary * 15 * Years) / 26
        const gratuityAmount = (lastDrawnSalary * 15 * years) / 26;

        gratuityResBasic.textContent = formatINR(basic);
        gratuityResDa.textContent = formatINR(da);
        gratuityResLastSalary.textContent = formatINR(lastDrawnSalary);
        gratuityResYears.textContent = `${years} Years`;
        gratuityResAmount.textContent = formatINR(gratuityAmount);
        gratuityYearsBadge.textContent = `${years} Years`;

        if (years < 5) {
            gratuityInfoText.innerHTML = `⚠️ <strong>Eligibility Notice:</strong> Under the Payment of Gratuity Act 1972, a minimum of 5 years continuous service is mandatory to be eligible for gratuity payout.<br>Formula applied: (${formatINR(lastDrawnSalary)} × 15 × ${years}) ÷ 26.`;
        } else {
            gratuityInfoText.innerHTML = `Formula: (Last Drawn Salary × 15 × Years of Service) ÷ 26.<br>Note: Service meets the 5-year eligibility criteria. Tax exemption limit is up to ₹20 Lakhs.`;
        }
    };

    bindSyncInputSlider(gratuityYearsInput, gratuityYearsSlider, calculateGratuity);
    gratuityBasicInput.addEventListener('input', calculateGratuity);
    gratuityDaInput.addEventListener('input', calculateGratuity);
    gratuityCalculateBtn.addEventListener('click', calculateGratuity);

    gratuityResetBtn.addEventListener('click', () => {
        gratuityBasicInput.value = '50000';
        gratuityDaInput.value = '10000';
        gratuityYearsInput.value = '15';
        gratuityYearsSlider.value = '15';
        calculateGratuity();
    });

    gratuityCopyBtn.addEventListener('click', () => {
        const summary = `💼 Gratuity Calculation Summary:\n` +
            `• Basic Salary: ${gratuityResBasic.textContent}\n` +
            `• Dearness Allowance: ${gratuityResDa.textContent}\n` +
            `• Last Drawn Salary: ${gratuityResLastSalary.textContent}\n` +
            `• Service Tenure: ${gratuityResYears.textContent}\n` +
            `• Estimated Gratuity: ${gratuityResAmount.textContent}`;
        copyToClipboard(summary);
    });

    /* --------------------------------------------------------------------------
       7. Normal Calculator (Pure JS Parser without eval)
       -------------------------------------------------------------------------- */
    const calcDisplay = document.getElementById('calc-display');
    const calcExpression = document.getElementById('calc-expression');
    const keypadButtons = document.querySelectorAll('.calc-keypad .btn');

    let currentVal = '0';
    let prevVal = '';
    let pendingOp = null;
    let resetOnNextDigit = false;

    const updateDisplay = () => {
        calcDisplay.textContent = currentVal;
        if (pendingOp && prevVal !== '') {
            const opSymbol = { add: '+', subtract: '-', multiply: '×', divide: '÷' }[pendingOp] || pendingOp;
            calcExpression.textContent = `${prevVal} ${opSymbol}`;
        } else {
            calcExpression.textContent = '';
        }
    };

    const handleDigit = (digit) => {
        if (resetOnNextDigit) {
            currentVal = digit === '.' ? '0.' : digit;
            resetOnNextDigit = false;
        } else {
            if (digit === '.') {
                if (!currentVal.includes('.')) {
                    currentVal += '.';
                }
            } else {
                currentVal = currentVal === '0' ? digit : currentVal + digit;
            }
        }
        updateDisplay();
    };

    const executeOperation = (a, b, op) => {
        const numA = parseFloat(a);
        const numB = parseFloat(b);
        if (isNaN(numA) || isNaN(numB)) return '0';

        switch (op) {
            case 'add':
                return (numA + numB).toString();
            case 'subtract':
                return (numA - numB).toString();
            case 'multiply':
                return (numA * numB).toString();
            case 'divide':
                if (numB === 0) return 'Error';
                return (numA / numB).toString();
            default:
                return numB.toString();
        }
    };

    const handleOperator = (op) => {
        if (pendingOp && !resetOnNextDigit) {
            currentVal = executeOperation(prevVal, currentVal, pendingOp);
            if (currentVal === 'Error') {
                resetCalculatorState();
                calcDisplay.textContent = 'Cannot divide by 0';
                return;
            }
        }
        prevVal = currentVal;
        pendingOp = op;
        resetOnNextDigit = true;
        updateDisplay();
    };

    const handleEquals = () => {
        if (!pendingOp || prevVal === '') return;
        const opSymbol = { add: '+', subtract: '-', multiply: '×', divide: '÷' }[pendingOp] || '';
        calcExpression.textContent = `${prevVal} ${opSymbol} ${currentVal} =`;

        const result = executeOperation(prevVal, currentVal, pendingOp);
        currentVal = result === 'Error' ? 'Cannot divide by 0' : sanitizeResult(result);
        pendingOp = null;
        prevVal = '';
        resetOnNextDigit = true;
        calcDisplay.textContent = currentVal;
    };

    const sanitizeResult = (valStr) => {
        const num = parseFloat(valStr);
        if (isNaN(num)) return '0';
        if (Number.isInteger(num)) return num.toString();
        return parseFloat(num.toFixed(8)).toString();
    };

    const resetCalculatorState = () => {
        currentVal = '0';
        prevVal = '';
        pendingOp = null;
        resetOnNextDigit = false;
        updateDisplay();
    };

    const handleDelete = () => {
        if (resetOnNextDigit) {
            currentVal = '0';
            resetOnNextDigit = false;
        } else {
            if (currentVal.length > 1) {
                currentVal = currentVal.slice(0, -1);
            } else {
                currentVal = '0';
            }
        }
        updateDisplay();
    };

    const handlePercent = () => {
        const num = parseFloat(currentVal);
        if (!isNaN(num)) {
            if (pendingOp && prevVal !== '') {
                const base = parseFloat(prevVal);
                currentVal = (base * (num / 100)).toString();
            } else {
                currentVal = (num / 100).toString();
            }
            updateDisplay();
        }
    };

    const handleNegate = () => {
        const num = parseFloat(currentVal);
        if (!isNaN(num) && num !== 0) {
            currentVal = (num * -1).toString();
            updateDisplay();
        }
    };

    keypadButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const digit = btn.dataset.digit;
            const action = btn.dataset.action;

            if (digit !== undefined) {
                handleDigit(digit);
            } else if (action) {
                switch (action) {
                    case 'add':
                    case 'subtract':
                    case 'multiply':
                    case 'divide':
                        handleOperator(action);
                        break;
                    case 'equals':
                        handleEquals();
                        break;
                    case 'clear':
                        resetCalculatorState();
                        break;
                    case 'delete':
                        handleDelete();
                        break;
                    case 'percent':
                        handlePercent();
                        break;
                    case 'negate':
                        handleNegate();
                        break;
                }
            }
        });
    });

    // Keyboard Shortcuts Listener
    document.addEventListener('keydown', (e) => {
        // Only process key events if normal calculator is active
        const normalPanel = document.getElementById('panel-normal');
        if (!normalPanel.classList.contains('active')) return;

        if (e.key >= '0' && e.key <= '9') {
            handleDigit(e.key);
        } else if (e.key === '.') {
            handleDigit('.');
        } else if (e.key === '+') {
            handleOperator('add');
        } else if (e.key === '-') {
            handleOperator('subtract');
        } else if (e.key === '*') {
            handleOperator('multiply');
        } else if (e.key === '/') {
            e.preventDefault();
            handleOperator('divide');
        } else if (e.key === 'Enter' || e.key === '=') {
            e.preventDefault();
            handleEquals();
        } else if (e.key === 'Backspace') {
            handleDelete();
        } else if (e.key === 'Escape') {
            resetCalculatorState();
        } else if (e.key === '%') {
            handlePercent();
        }
    });

    /* --------------------------------------------------------------------------
       8. Initial Application Run
       -------------------------------------------------------------------------- */
    calculateGST();
    initEMIChart();
    calculateEMI();
    initFDChart();
    calculateFD();
    initSIPChart();
    calculateSIP();
    initRDChart();
    calculateRD();
    calculateGratuity();

});
