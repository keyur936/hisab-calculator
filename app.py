# ==============================================================================
# Hisab Calculator - All-in-One Financial Suite in Python (Streamlit)
# ==============================================================================
# Run command: streamlit run app.py
# Required libraries: pip install streamlit plotly

import streamlit as st
import plotly.graph_objects as go
import ast
import operator as op

# Page Configuration & Styling
st.set_page_config(
    page_title="Hisab Calculator – All-in-One Financial Suite",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Currency Options Dictionary
CURRENCIES = {
    "🇮🇳 INR (₹) Rupee": {"symbol": "₹", "sep": True},
    "🇺🇸 USD ($) Dollar": {"symbol": "$", "sep": False},
    "🇪🇺 EUR (€) Euro": {"symbol": "€", "sep": False},
    "🇬🇧 GBP (£) Pound": {"symbol": "£", "sep": False},
    "🇹🇭 THB (฿) Baht": {"symbol": "฿", "sep": False},
    "🇦🇪 AED (د.إ) Dirham": {"symbol": "AED ", "sep": False},
    "🇯🇵 JPY (¥) Yen": {"symbol": "¥", "sep": False},
    "🇨🇦 CAD ($) Dollar": {"symbol": "C$", "sep": False}
}

# Sidebar Navigation Header
st.sidebar.title("⚡ Hisab Calculator")
st.sidebar.caption("All-in-One Financial Dashboard")

selected_currency_label = st.sidebar.selectbox(
    "Select Currency / मुद्रा:",
    list(CURRENCIES.keys()),
    index=0
)

curr_symbol = CURRENCIES[selected_currency_label]["symbol"]

# Helper Function: Dynamic Currency Formatter
def format_inr(val):
    if val is None:
        return f"{curr_symbol} 0.00"
    s, *d = f"{val:.2f}".split(".")
    if CURRENCIES[selected_currency_label]["sep"] and len(s) > 3:
        r = ",".join([s[-3:]] + [s[:-3][max(0, i - 2):i] for i in range(len(s[:-3]), 0, -2)][::-1])
    else:
        r = f"{int(s):,}"
    return f"{curr_symbol} {r}.{d[0]}"

calc_option = st.sidebar.radio(
    "Select Calculator",
    [
        "🧾 GST Calculator",
        "💰 EMI Calculator",
        "🏦 FD Calculator",
        "📈 SIP Calculator",
        "🔄 RD Calculator",
        "💼 Gratuity Calculator",
        "🔢 Normal Calculator"
    ]
)

st.sidebar.markdown("---")

# ------------------------------------------------------------------------------
# 1. GST CALCULATOR
# ------------------------------------------------------------------------------
if calc_option == "🧾 GST Calculator":
    st.header("🧾 GST Calculator")
    st.caption("Calculate GST inclusive and exclusive tax amounts instantly")
    
    col1, col2 = st.columns([1, 1])
    
    with col1:
        st.subheader("Enter Parameters")
        amount = st.number_input("Amount (₹)", min_value=0.0, value=10000.0, step=500.0)
        mode = st.radio("GST Mode", ["Add GST (Exclusive)", "Remove GST (Inclusive)"])
        
        gst_rate = st.selectbox("GST Rate (%)", [5.0, 12.0, 18.0, 28.0], index=2)
        custom_rate = st.number_input("Custom GST Rate (%) [Optional]", min_value=0.0, max_value=100.0, value=gst_rate, step=0.1)
        rate = custom_rate if custom_rate != gst_rate else gst_rate

    with col2:
        st.subheader("Calculation Breakdown")
        if "Exclusive" in mode:
            original = amount
            tax = amount * (rate / 100)
            final = amount + tax
        else:
            final = amount
            original = amount / (1 + (rate / 100))
            tax = amount - original
            
        cgst = tax / 2
        sgst = tax / 2
        
        st.metric("Final Total Amount", format_inr(final))
        
        mcol1, mcol2 = st.columns(2)
        mcol1.metric("Base / Net Amount", format_inr(original))
        mcol2.metric(f"Total GST ({rate}%)", format_inr(tax))
        
        mcol3, mcol4 = st.columns(2)
        mcol3.metric(f"CGST ({rate/2:.1f}%)", format_inr(cgst))
        mcol4.metric(f"SGST ({rate/2:.1f}%)", format_inr(sgst))


# ------------------------------------------------------------------------------
# 2. EMI CALCULATOR
# ------------------------------------------------------------------------------
elif calc_option == "💰 EMI Calculator":
    st.header("💰 EMI Calculator")
    st.caption("Calculate Equated Monthly Installments and interest breakdown")
    
    col1, col2 = st.columns([1, 1])
    
    with col1:
        st.subheader("Loan Details")
        principal = st.number_input("Loan Amount (₹)", min_value=1000.0, value=500000.0, step=10000.0)
        rate_pa = st.number_input("Interest Rate (% p.a.)", min_value=0.1, value=8.5, step=0.1)
        
        tenure_unit = st.radio("Tenure Unit", ["Years", "Months"], horizontal=True)
        tenure_val = st.number_input(f"Tenure ({tenure_unit})", min_value=1, value=5 if tenure_unit == "Years" else 60)
        
        N = tenure_val * 12 if tenure_unit == "Years" else tenure_val
        R = (rate_pa / 100) / 12

    with col2:
        st.subheader("Payment Summary")
        if R > 0:
            emi = (principal * R * ((1 + R) ** N)) / (((1 + R) ** N) - 1)
        else:
            emi = principal / N
            
        total_payable = emi * N
        total_interest = total_payable - principal
        
        st.metric("Monthly EMI", format_inr(emi))
        
        mcol1, mcol2 = st.columns(2)
        mcol1.metric("Principal Amount", format_inr(principal))
        mcol2.metric("Total Interest Payable", format_inr(total_interest))
        
        # Donut Chart
        fig = go.Figure(data=[go.Pie(
            labels=['Principal Amount', 'Total Interest'],
            values=[principal, max(0, total_interest)],
            hole=.6,
            marker_colors=['#6366f1', '#f59e0b']
        )])
        fig.update_layout(margin=dict(t=20, b=20, l=20, r=20), height=220)
        st.plotly_chart(fig, use_container_width=True)


# ------------------------------------------------------------------------------
# 3. FD CALCULATOR
# ------------------------------------------------------------------------------
elif calc_option == "🏦 FD Calculator":
    st.header("🏦 FD Calculator")
    st.caption("Calculate Fixed Deposit maturity amount and compound interest")
    
    col1, col2 = st.columns([1, 1])
    
    with col1:
        st.subheader("Deposit Details")
        principal = st.number_input("Total Investment (₹)", min_value=1000.0, value=100000.0, step=5000.0)
        rate_pa = st.number_input("Interest Rate (% p.a.)", min_value=0.1, value=7.0, step=0.1)
        
        tenure_unit = st.radio("Tenure Unit", ["Years", "Months"], horizontal=True)
        tenure_val = st.number_input(f"Tenure ({tenure_unit})", min_value=1, value=3 if tenure_unit == "Years" else 36)
        
        freq_dict = {"Quarterly": 4, "Monthly": 12, "Half-Yearly": 2, "Yearly": 1}
        freq_label = st.selectbox("Compounding Frequency", list(freq_dict.keys()), index=0)
        n = freq_dict[freq_label]
        
        t_years = tenure_val if tenure_unit == "Years" else tenure_val / 12.0

    with col2:
        st.subheader("Maturity Summary")
        maturity_amount = principal * ((1 + (rate_pa / (n * 100))) ** (n * t_years))
        interest_earned = maturity_amount - principal
        
        st.metric("Total Maturity Amount", format_inr(maturity_amount))
        
        mcol1, mcol2 = st.columns(2)
        mcol1.metric("Principal Invested", format_inr(principal))
        mcol2.metric("Interest Earned", format_inr(interest_earned))
        
        fig = go.Figure(data=[go.Pie(
            labels=['Principal Invested', 'Interest Earned'],
            values=[principal, max(0, interest_earned)],
            hole=.6,
            marker_colors=['#6366f1', '#38bdf8']
        )])
        fig.update_layout(margin=dict(t=20, b=20, l=20, r=20), height=220)
        st.plotly_chart(fig, use_container_width=True)


# ------------------------------------------------------------------------------
# 4. SIP CALCULATOR
# ------------------------------------------------------------------------------
elif calc_option == "📈 SIP Calculator":
    st.header("📈 SIP Calculator")
    st.caption("Calculate wealth projection for Systematic Investment Plans with optional step-up")
    
    col1, col2 = st.columns([1, 1])
    
    with col1:
        st.subheader("SIP Details")
        monthly_inv = st.number_input("Monthly Investment (₹)", min_value=500.0, value=5000.0, step=500.0)
        rate_pa = st.number_input("Expected Annual Return (%)", min_value=1.0, value=12.0, step=0.5)
        years = st.number_input("Investment Duration (Years)", min_value=1, value=10, step=1)
        
        enable_stepup = st.checkbox("Enable Annual Step-up SIP (%)")
        stepup_pct = 0.0
        if enable_stepup:
            stepup_pct = st.number_input("Annual Step-up Increase (%)", min_value=1.0, value=10.0, step=1.0)

    with col2:
        st.subheader("Wealth Summary")
        if not enable_stepup or stepup_pct <= 0:
            i = (rate_pa / 100) / 12
            n = years * 12
            total_invested = monthly_inv * n
            final_val = monthly_inv * ((( (1 + i)**n ) - 1) / i) * (1 + i)
            returns = final_val - total_invested
        else:
            monthly_rate = (rate_pa / 100) / 12
            curr_installment = monthly_inv
            curr_val = 0.0
            total_invested = 0.0
            
            for yr in range(1, years + 1):
                for m in range(12):
                    curr_val = (curr_val + curr_installment) * (1 + monthly_rate)
                    total_invested += curr_installment
                curr_installment += curr_installment * (stepup_pct / 100.0)
                
            final_val = curr_val
            returns = final_val - total_invested
            
        st.metric("Final Portfolio Value", format_inr(final_val))
        
        mcol1, mcol2 = st.columns(2)
        mcol1.metric("Total Invested Amount", format_inr(total_invested))
        mcol2.metric("Estimated Returns", format_inr(returns))
        
        fig = go.Figure(data=[go.Pie(
            labels=['Total Invested', 'Estimated Returns'],
            values=[total_invested, max(0, returns)],
            hole=.6,
            marker_colors=['#6366f1', '#10b981']
        )])
        fig.update_layout(margin=dict(t=20, b=20, l=20, r=20), height=220)
        st.plotly_chart(fig, use_container_width=True)


# ------------------------------------------------------------------------------
# 5. RD CALCULATOR
# ------------------------------------------------------------------------------
elif calc_option == "🔄 RD Calculator":
    st.header("🔄 RD Calculator")
    st.caption("Calculate Recurring Deposit interest and estimated maturity value")
    
    col1, col2 = st.columns([1, 1])
    
    with col1:
        st.subheader("Recurring Deposit Details")
        monthly_dep = st.number_input("Monthly Deposit Amount (₹)", min_value=500.0, value=5000.0, step=500.0)
        rate_pa = st.number_input("Annual Interest Rate (%)", min_value=0.1, value=7.5, step=0.1)
        
        tenure_unit = st.radio("Tenure Unit", ["Months", "Years"], horizontal=True)
        tenure_val = st.number_input(f"Tenure ({tenure_unit})", min_value=1, value=12 if tenure_unit == "Months" else 1)
        
        freq_dict = {"Quarterly": 4, "Monthly": 12, "Half-Yearly": 2, "Yearly": 1}
        freq_label = st.selectbox("Compounding Frequency", list(freq_dict.keys()), index=0)
        n = freq_dict[freq_label]
        
        M = tenure_val * 12 if tenure_unit == "Years" else tenure_val

    with col2:
        st.subheader("RD Maturity Summary")
        total_maturity = 0.0
        for k in range(1, M + 1):
            t_k = (M - k + 1) / 12.0
            total_maturity += monthly_dep * ((1 + (rate_pa / (n * 100))) ** (n * t_k))
            
        total_deposited = monthly_dep * M
        interest_earned = total_maturity - total_deposited
        
        st.metric("Total Maturity Amount", format_inr(total_maturity))
        
        mcol1, mcol2 = st.columns(2)
        mcol1.metric("Total Deposited Amount", format_inr(total_deposited))
        mcol2.metric("Interest Earned", format_inr(interest_earned))
        
        st.info("ℹ️ **Disclaimer:** This calculation is an estimate. Bank RD compounding algorithms may vary slightly based on exact quarterly calendar days.")
        
        fig = go.Figure(data=[go.Pie(
            labels=['Total Deposited', 'Interest Earned'],
            values=[total_deposited, max(0, interest_earned)],
            hole=.6,
            marker_colors=['#6366f1', '#8b5cf6']
        )])
        fig.update_layout(margin=dict(t=20, b=20, l=20, r=20), height=200)
        st.plotly_chart(fig, use_container_width=True)


# ------------------------------------------------------------------------------
# 6. GRATUITY CALCULATOR
# ------------------------------------------------------------------------------
elif calc_option == "💼 Gratuity Calculator":
    st.header("💼 Gratuity Calculator")
    st.caption("Estimate retirement gratuity payout based on Last Drawn Salary and service tenure")
    
    col1, col2 = st.columns([1, 1])
    
    with col1:
        st.subheader("Employment Details")
        basic = st.number_input("Last Drawn Basic Salary (₹)", min_value=0.0, value=50000.0, step=1000.0)
        da = st.number_input("Dearness Allowance (DA) (₹)", min_value=0.0, value=10000.0, step=1000.0)
        years = st.number_input("Completed Years of Service", min_value=1, value=15, step=1)

    with col2:
        st.subheader("Gratuity Summary")
        last_drawn_salary = basic + da
        gratuity_amount = (last_drawn_salary * 15 * years) / 26.0
        
        st.metric("Estimated Gratuity Amount", format_inr(gratuity_amount))
        
        mcol1, mcol2 = st.columns(2)
        mcol1.metric("Last Drawn Salary (Basic + DA)", format_inr(last_drawn_salary))
        mcol2.metric("Completed Service", f"{years} Years")
        
        if years < 5:
            st.warning("⚠️ **Notice:** Minimum 5 years of continuous service is mandatory for eligibility under the Payment of Gratuity Act 1972.")
        else:
            st.success("✅ Service meets the mandatory 5-year eligibility requirement under the Payment of Gratuity Act 1972.")


# ------------------------------------------------------------------------------
# 7. NORMAL CALCULATOR
# ------------------------------------------------------------------------------
elif calc_option == "🔢 Normal Calculator":
    st.header("🔢 Normal Calculator")
    st.caption("Standard math calculator built natively in Python")
    
    col1, col2 = st.columns([1, 1])
    
    with col1:
        expr = st.text_input("Enter Math Expression", value="12 + 5 * 2", help="e.g. 5000 * 12 / 100")
        
        # Safe expression evaluator
        def safe_eval(expr_str):
            operators = {ast.Add: op.add, ast.Sub: op.sub, ast.Mult: op.mul,
                         ast.Div: op.truediv, ast.Pow: op.pow, ast.USub: op.neg}
            def eval_(node):
                if isinstance(node, ast.Num):
                    return node.n
                elif isinstance(node, ast.BinOp):
                    return operators[type(node.op)](eval_(node.left), eval_(node.right))
                elif isinstance(node, ast.UnaryOp):
                    return operators[type(node.op)](eval_(node.operand))
                else:
                    raise TypeError(node)
            try:
                return eval_(ast.parse(expr_str, mode='eval').body)
            except Exception:
                return "Invalid Expression"

        if st.button("Calculate Result", type="primary"):
            res = safe_eval(expr)
            if isinstance(res, (int, float)):
                st.success(f"**Result:** `{res}`")
            else:
                st.error("Please enter a valid mathematical expression (e.g. 100 + 25 * 4)")

    with col2:
        st.subheader("Supported Operations")
        st.markdown("""
        - `+` Addition
        - `-` Subtraction
        - `*` Multiplication
        - `/` Division
        - `**` Exponent / Power
        - `( )` Parentheses
        """)
