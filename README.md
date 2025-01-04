Document Library Project

This repository contains the complete implementation of the Document Library system, which includes:

1.	Backend: DocumentLibraryApi (C#/.NET API)
2.	Frontend: document-library-app (React.js application)
   
Follow the steps below to set up, build, and run the project.
________________________________________
Prerequisites

Before you begin, ensure the following software and tools are installed on your machine:

1. Install Node.js and npm
  •	Download and install the latest stable version of Node.js from the Node.js Official Website.
  •	Verify installation:
    node -v
    npm -v

2. Install Required Editors and Tools
  •	Visual Studio: Required for running and managing the backend (DocumentLibraryApi).
  •	Visual Studio Code: Recommended for working with the frontend (document-library-app).

3. Configure Node.js Environment (Windows Users)
  1.	Press Win + R, type sysdm.cpl, and press Enter to open System Properties.
  2.	Go to the Advanced tab and click Environment Variables.
  3.	Under System Variables, locate the Path variable and click Edit.
  4.	Add the path to your Node.js installation (e.g., C:\Program Files\nodejs\).
  5.	Click OK to save and close all windows.
  6.	Restart your terminal or command prompt.

4. Install SQL Server and SQL Server Management Studio
  •	Install SQL Server for database management.
  •	Install SQL Server Management Studio (SSMS) for interacting with the database.

________________________________________
Project Structure
/DocumentLibraryProject
    /DocumentLibraryApi        # Backend code
    /document-library-app      # Frontend code
    README.md                  # Project documentation

________________________________________
Setup Instructions

  1. Backend Setup (DocumentLibraryApi)

  Step 1. Open Project
      •	Open the DocumentLibraryApi folder in Visual Studio.

  Step 2. Configure Database
      •	Ensure the connection string in appsettings.json points to your SQL Server instance.

  Step 3. Update Database
      1.	Navigate to Tools -> NuGet Package Manager -> Package Manager Console.
      2.	Run the following command:
          Update-Database
      3.	Verify that the DocumentLibraryDb database has been created using SQL Server Management Studio (SSMS).

  Step 4. Run the API
      •	Press F5 in Visual Studio to build and run the API.
      •	Verify the API is running at https://localhost:7160/ or the specified endpoint.
      
________________________________________
2. Frontend Setup (document-library-app)

  Step 1. Open Project
    •	Open the document-library-app folder in Visual Studio Code.
 
  Step 2. Update API Base URL
    •	Open the file api.ts where the API_BASE_URL is defined.
    •	Update the API_BASE_URL constant to match your backend API endpoint (e.g., https://localhost:7160/api/documents). Example:
      const API_BASE_URL = ' https://localhost:7160/api/documents';
  
  Step 3. Install Dependencies
    •	Open the terminal in VS Code and run:
      npm install
    •	Verify the node_modules folder has been created.
 
  Step 4. Build the Project
    •	Run the following command:
      npm run build
  
  Step 5. Start the Application
    •	Start the development server:
      npm run start
    •	Open the application in your browser at http://localhost:3000/.
    
________________________________________
Running the Project

  1.	Start Backend (API):
    o	Run the DocumentLibraryApi project in Visual Studio.
  
  2.	Start Frontend (UI):
    o	Run npm run start in the document-library-app project directory.
  
  3.	Verify that the frontend is correctly interacting with the backend by testing the application features.

