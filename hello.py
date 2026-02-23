# ============================================================
# CODING BASICS - hello.py
# A beginner-friendly introduction to programming with Python
# ============================================================


# ----- 1. PRINT (output text to the screen) -----
print("Hello, World!")          # The classic first program
print("Hello, Andrew!")         # You can print anything


# ----- 2. VARIABLES (storing data) -----
name = "Andrew"                 # String  - text, wrapped in quotes
age = 30                        # Integer - whole number
height = 5.11                   # Float   - decimal number
is_learning = True              # Boolean - True or False

print(name, "is", age, "years old")


# ----- 3. STRINGS (working with text) -----
greeting = "Hello, " + name + "!"      # Concatenation (joining strings)
greeting_f = f"Hello, {name}!"         # f-string (modern, preferred way)
print(greeting)
print(greeting_f)
print(name.upper())                    # Methods: ANDREW
print(name.lower())                    # Methods: andrew
print(len(name))                       # Length: 6


# ----- 4. NUMBERS & MATH -----
x = 10
y = 3
print(x + y)    # Addition:       13
print(x - y)    # Subtraction:    7
print(x * y)    # Multiplication: 30
print(x / y)    # Division:       3.333...
print(x // y)   # Floor division: 3  (drops the decimal)
print(x % y)    # Modulo:         1  (remainder after division)
print(x ** y)   # Exponent:       1000 (10 to the power of 3)


# ----- 5. LISTS (ordered collections of items) -----
fruits = ["apple", "banana", "cherry"]
print(fruits[0])        # First item:  apple  (indexing starts at 0!)
print(fruits[-1])       # Last item:   cherry
fruits.append("date")   # Add to end
print(fruits)           # ['apple', 'banana', 'cherry', 'date']
print(len(fruits))      # Number of items: 4


# ----- 6. IF / ELIF / ELSE (making decisions) -----
score = 85

if score >= 90:
    print("Grade: A")
elif score >= 80:
    print("Grade: B")   # This runs because 85 >= 80
elif score >= 70:
    print("Grade: C")
else:
    print("Grade: F")


# ----- 7. FOR LOOPS (repeat code for each item) -----
for fruit in fruits:
    print("I like", fruit)

# Loop over a range of numbers (0 through 4)
for i in range(5):
    print(i, end=" ")   # prints: 0 1 2 3 4
print()                 # newline


# ----- 8. WHILE LOOPS (repeat while a condition is true) -----
count = 0
while count < 3:
    print("count is", count)
    count += 1          # Same as: count = count + 1


# ----- 9. FUNCTIONS (reusable blocks of code) -----
def greet(person_name):
    """This is a docstring - it describes what the function does."""
    return f"Hello, {person_name}! Welcome to coding."

def add(a, b):
    return a + b

message = greet("Andrew")
print(message)
print(add(4, 7))        # 11


# ----- 10. DICTIONARIES (key-value pairs, like a lookup table) -----
person = {
    "name": "Andrew",
    "job": "Nielsen",
    "hobby": "GitHub branching"
}
print(person["name"])           # Andrew
print(person["hobby"])          # GitHub branching
person["city"] = "New York"     # Add a new key-value pair
print(person)
