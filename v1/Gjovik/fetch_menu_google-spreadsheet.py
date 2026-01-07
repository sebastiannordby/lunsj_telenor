from pathlib import Path
import gspread
import pandas as pd

def download_google_spreadsheet_as_xlsx(spreadsheet_id: str, credentials_file: str, file_name: str):
    base_dir = Path(__file__).resolve().parent
    output_path = base_dir / f"{file_name}.xlsx"

    gc = gspread.service_account(filename=credentials_file)
    spreadsheet = gc.open_by_key(spreadsheet_id)

    with pd.ExcelWriter(output_path, engine="xlsxwriter") as writer:
        for worksheet in spreadsheet.worksheets():
            data = worksheet.get_all_values()
            df = pd.DataFrame(data)
            sheet_name = worksheet.title[:31]
            df.to_excel(writer, sheet_name=sheet_name, index=False)

    return output_path


# Example usage
spreadsheet_id = "1wWggJvcz4Pe3F9ntt7unESaXhEtlIacsfPdVVys_n8U"
credentials_file = "/home/marius/git/lunsj_telenor/telenor-lunsj.json"
file_name = "Lunsj_Gjovik"

try:
    out = download_google_spreadsheet_as_xlsx(spreadsheet_id, credentials_file, file_name)
except Exception as e:
    print(f"Noe gikk galt under oppdatering av meny: {e}")
else:
    print(f"Lunsjmenyene er oppdatert uten feil! Skrev fil: {out}")
