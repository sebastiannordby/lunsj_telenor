import gspread
from oauth2client.service_account import ServiceAccountCredentials
import pandas as pd


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

try:
    download_google_spreadsheet_as_xlsx(spreadsheet_id, credentials_file, file_name)
except:
    print("Noe gikk galt under oppdatering av meny. Prøv på nytt eller ta kontakt.")
else:
    print("Suksess: Lunsjmenyene er oppdatert!")
