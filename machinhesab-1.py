# ==========================================
# وارد کردن کتابخانه‌های مورد نیاز
# ==========================================

from mcp.server.fastmcp import FastMCP

# ==========================================
# ساخت سرور MCP
# ==========================================

# ایجاد یک سرور MCP با نام Calculator
mcp = FastMCP("Calculator")

# ==========================================
# لیست تاریخچه محاسبات
# ==========================================

# تمام عملیات انجام شده داخل این لیست ذخیره می‌شوند
history = []

# ==========================================
# تابع کمکی برای ذخیره تاریخچه
# ==========================================

def save_history(operation, a, b, result):
    """
    این تابع نتیجه هر محاسبه را داخل تاریخچه ذخیره می‌کند.
    """

    history.append(
        {
            "operation": operation,
            "a": a,
            "b": b,
            "result": result
        }
    )

# ==========================================
# ابزار جمع
# ==========================================

@mcp.tool()
def add(a: float, b: float):
    """
    جمع دو عدد
    """

    result = a + b

    save_history("add", a, b, result)

    return {
        "operation": "add",
        "a": a,
        "b": b,
        "result": result
    }


# ==========================================
# ابزار تفریق
# ==========================================

@mcp.tool()
def subtract(a: float, b: float):
    """
    تفریق دو عدد
    """

    result = a - b

    save_history("subtract", a, b, result)

    return {
        "operation": "subtract",
        "a": a,
        "b": b,
        "result": result
    }


# ==========================================
# ابزار ضرب
# ==========================================

@mcp.tool()
def multiply(a: float, b: float):
    """
    ضرب دو عدد
    """

    result = a * b

    save_history("multiply", a, b, result)

    return {
        "operation": "multiply",
        "a": a,
        "b": b,
        "result": result
    }
    
    # ==========================================
# ابزار تقسیم
# ==========================================

@mcp.tool()
def divide(a: float, b: float):
    """
    تقسیم دو عدد
    """

    # بررسی تقسیم بر صفر
    if b == 0:
        return {
            "operation": "divide",
            "a": a,
            "b": b,
            "error": "Division by zero is not allowed."
        }

    result = a / b

    save_history("divide", a, b, result)

    return {
        "operation": "divide",
        "a": a,
        "b": b,
        "result": result
    }


# ==========================================
# ابزار توان
# ==========================================

@mcp.tool()
def power(a: float, b: float):
    """
    محاسبه توان
    """

    result = a ** b

    save_history("power", a, b, result)

    return {
        "operation": "power",
        "a": a,
        "b": b,
        "result": result
    }
    
    # ==========================================
# ابزار نمایش تاریخچه
# ==========================================

@mcp.tool()
def get_history():
    """
    نمایش تمام محاسبات انجام شده
    """

    return history


# ==========================================
# ابزار پاک کردن تاریخچه
# ==========================================

@mcp.tool()
def clear_history():
    """
    پاک کردن تاریخچه محاسبات
    """

    history.clear()

    return {
        "message": "History cleared successfully."
    }


# ==========================================
# اجرای سرور MCP
# ==========================================
if __name__ == "__main__":
    print("Calculator MCP Server is running...")
    mcp.run()
    
