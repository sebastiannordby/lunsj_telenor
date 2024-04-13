import gspread
from oauth2client.service_account import ServiceAccountCredentials
import pandas as pd
import os.path
import time
import tkinter as tk
from tkinter import messagebox

file_path = 'Lunsj_Fornebu.xlsx'

# Check if the file exists
if os.path.exists(file_path):
    # Get the last modification time
    last_modified_timestamp = os.path.getmtime(file_path)

    # Convert the timestamp to a human-readable format
    last_modified_time = time.strftime('%d-%m-%Y %H:%M:%S', time.localtime(last_modified_timestamp))

    print(f"Lunsjmenyene ble sist oppdatert: {last_modified_time}")
else:
    print("Filen eksisterer ikke.")

def download_google_spreadsheet_as_xlsx(spreadsheet_id, credentials_file, file_name):
    # Define the scope
    scope = ['https://spreadsheets.google.com/feeds',
             'https://www.googleapis.com/auth/drive']

    # Load credentials
    credentials = ServiceAccountCredentials.from_json_keyfile_name(credentials_file, scope)

    # Authorize the client
    client = gspread.authorize(credentials)

    # Open the spreadsheet
    spreadsheet = client.open_by_key(spreadsheet_id)

    # Create a Pandas Excel writer using XlsxWriter as the engine
    writer = pd.ExcelWriter(f"{file_name}.xlsx", engine='xlsxwriter')

    # Iterate over each worksheet and write its data to the Excel file
    for worksheet in spreadsheet.worksheets():
        data = worksheet.get_all_values()
        df = pd.DataFrame(data)
        df.to_excel(writer, sheet_name=worksheet.title, index=False)

    # Close the Pandas Excel writer
    writer._save()

# Example usage
spreadsheet_id = '1gK9309oX00vC1aeKPgrCpHxoMdJ0jgGj3DGXYDp30tk'
credentials_file = '../telenor-lunsj.json'
file_name = 'Lunsj_Fornebu'

def continue_script():
    # Display a message box for confirmation
    result = messagebox.askquestion("Confirmation", "Skal menyene oppdateres?")

    # Check the user's response
    if result == 'yes':
        # Continue with the script
        print("Menyene oppdateres...")
        try:
            download_google_spreadsheet_as_xlsx(spreadsheet_id, credentials_file, file_name)
        except:
            print("Noe gikk galt under oppdatering av meny. Prøv på nytt eller ta kontakt.")
            exit()
        else:
            print("Lunsjmenyene er oppdatert uten feil!")
            exit()
    else:
        # Stop the script or perform any other action
        print("Menyene ikke oppdatert.")
        exit()

# Create a Tkinter window
window = tk.Tk()

# Create a button to trigger the confirmation dialog
button = tk.Button(window, text="Oppdatere menyene?", command=continue_script)
button.pack()

# Run the Tkinter event loop
window.mainloop()
