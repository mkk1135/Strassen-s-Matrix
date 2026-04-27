# Strassen Matrix Multiplication Visualizer

---

## ABOUT

This project is an interactive web-based visualization tool for Strassen’s matrix multiplication algorithm. It helps you understand how the algorithm works internally by breaking down each step of the computation.

The tool shows:
- Division of matrices into submatrices
- Computation of intermediate products P1 to P7
- Combination into the final result matrix
- Comparison with the naive multiplication method

It also includes learning modules to explain complexity, access patterns, and divide and conquer design.

Live Demo:  
https://mkk1135.github.io/Strassen-s-Matrix/

---

## PROJECT STRUCTURE

```
project-folder/
├── index.html      # Main application interface
├── style.css       # Styling and layout
├── script.js       # Algorithm logic and visualization
└── README.md       # Documentation
```

### File Details

index.html  
Defines layout, panels, controls, and tabs.

style.css  
Handles layout, colors, responsiveness, and UI styling.

script.js  
Implements Strassen’s algorithm, step execution, visualization, charts, and interactions.

---

## HOW TO RUN

### Run Locally

1. Download or clone the repository:
   ```
   git clone https://github.com/your-username/your-repo-name.git
   ```

2. Open the project folder.

3. Open `index.html` in a browser.

---

### Run Online

Open the live version:  
https://mkk1135.github.io/Strassen-s-Matrix/

---

## USAGE GUIDE

### Matrix Input
- Enter values manually or use presets
- Step-by-step mode supports 2×2 matrices

### Controls
- Build Steps: prepares execution
- Step: executes one step
- Play: runs automatically
- Pause: stops execution
- Reset: clears everything
- Speed: controls animation speed

### Execution Behavior
Each step:
- Highlights pseudocode
- Shows calculation with actual values
- Updates counters
- Updates visualization

### Operation Counters
- Multiplications
- Add/Subtract operations
- Naive multiplications
- Operations saved

### Visualization
- Matrices A and B displayed as grids
- P1–P7 appear during computation
- Result matrix C builds step by step

### Step History
- Shows all steps with descriptions
- Click any step to jump back

---

## LEARNING MODULES

### CLO-1: Complexity Analysis
- O(n³) vs O(n^2.807)
- Growth comparison charts
- Crossover point visualization

### CLO-2: Access Patterns
- Shows element access
- Compares naive vs Strassen method
- Demonstrates reduced multiplications

### CLO-3: Divide and Conquer
- Matrix splitting visualization
- Recursion tree
- 7 recursive calls vs 8 naive

### Learn Tab
- Algorithm explanation
- Worked example
- Key concepts
- Common mistakes
- Space complexity

---

## WORKFLOW SUMMARY

1. Input matrices or choose preset  
2. Click Build Steps  
3. Run using Step or Play  
4. Observe visualization and explanations  
5. View final result  
6. Explore learning tabs  

---

## KEY CONCEPT

Strassen’s algorithm:
- Divides matrices into smaller parts  
- Computes 7 products instead of 8  
- Combines results to produce final matrix  

This reduces time complexity from O(n³) to O(n^2.807).

---

## TECHNOLOGIES USED

- HTML  
- CSS  
- JavaScript  
- SVG and Canvas  

---

## STUDENT INFO

Name: Your Name  
Roll Number: Your Roll Number  
Course: Design and Analysis of Algorithms  
Project: Strassen Matrix Multiplication Visualizer
