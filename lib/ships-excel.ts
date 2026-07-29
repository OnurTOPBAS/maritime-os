import * as XLSX from "xlsx"

export interface ShipExcelData {
  name: string
  imo_number?: string
  flag?: string
  vessel_type?: string
  dwt?: number
  grt?: number
  nrt?: number
  built_year?: number
  loa?: number
  beam?: number
  draft?: number
  main_engine?: string
  engine_power?: string
  speed_laden?: number
  speed_ballast?: number
  status: string
  current_position?: string
  fleet_id: string
  latitude?: number
  longitude?: number
  consumption_operations?: {
    loading?: { fo?: number; mgo?: number }
    discharge?: { fo?: number; mgo?: number }
    laden?: { fo?: number; mgo?: number }
    ballast?: { fo?: number; mgo?: number }
    anchor?: { fo?: number; mgo?: number }
    idle?: { fo?: number; mgo?: number }
  }
  particulars_file_url?: string
  fuel_consumption_file_url?: string
  fleet_name?: string
  company_name?: string
}

export function generateShipsTemplate() {
  const template = [
    {
      "Gemi Adı": "MV EXAMPLE",
      "IMO Numarası": "1234567",
      Bayrak: "Panama",
      "Gemi Tipi": "Bulk Carrier",
      "DWT (MT)": 75000,
      GRT: 40000,
      NRT: 25000,
      "İnşa Yılı": 2015,
      "LOA (m)": 225,
      "Beam (m)": 32,
      "Draft (m)": 14.5,
      "Ana Makine": "MAN B&W",
      "Makine Gücü": "12000 HP",
      "Yüklü Hız (knot)": 14.5,
      "Boş Hız (knot)": 15.0,
      Durum: "active",
      "Mevcut Pozisyon": "Singapore",
      "Filo ID": "",
    },
  ]

  const ws = XLSX.utils.json_to_sheet(template)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Gemiler")

  // Add instructions sheet
  const instructions = [
    { Alan: "Gemi Adı", Zorunlu: "Evet", Açıklama: "Geminin adı" },
    { Alan: "IMO Numarası", Zorunlu: "Hayır", Açıklama: "7 haneli IMO numarası" },
    { Alan: "Bayrak", Zorunlu: "Hayır", Açıklama: "Gemi bayrağı" },
    { Alan: "Gemi Tipi", Zorunlu: "Hayır", Açıklama: "Bulk Carrier, Tanker, Container, vb." },
    { Alan: "DWT (MT)", Zorunlu: "Hayır", Açıklama: "Deadweight tonnage" },
    { Alan: "Durum", Zorunlu: "Evet", Açıklama: "active, inactive, maintenance, idle, anchored, in_port, at_sea" },
    { Alan: "Enlem", Zorunlu: "Hayır", Açıklama: "Geminin enlem bilgisi" },
    { Alan: "Boylam", Zorunlu: "Hayır", Açıklama: "Geminin boylam bilgisi" },
    { Alan: "FO Loading (MT/day)", Zorunlu: "Hayır", Açıklama: "Yükleme sırasında FO yakıt tüketimi" },
    { Alan: "MGO Loading (MT/day)", Zorunlu: "Hayır", Açıklama: "Yükleme sırasında MGO yakıt tüketimi" },
    { Alan: "FO Discharge (MT/day)", Zorunlu: "Hayır", Açıklama: "İşlem sırasında FO yakıt tüketimi" },
    { Alan: "MGO Discharge (MT/day)", Zorunlu: "Hayır", Açıklama: "İşlem sırasında MGO yakıt tüketimi" },
    { Alan: "FO Laden (MT/day)", Zorunlu: "Hayır", Açıklama: "Yüklü gemi sırasında FO yakıt tüketimi" },
    { Alan: "MGO Laden (MT/day)", Zorunlu: "Hayır", Açıklama: "Yüklü gemi sırasında MGO yakıt tüketimi" },
    { Alan: "FO Ballast (MT/day)", Zorunlu: "Hayır", Açıklama: "Boş gemi sırasında FO yakıt tüketimi" },
    { Alan: "MGO Ballast (MT/day)", Zorunlu: "Hayır", Açıklama: "Boş gemi sırasında MGO yakıt tüketimi" },
    { Alan: "FO Anchor (MT/day)", Zorunlu: "Hayır", Açıklama: "Anker gemi sırasında FO yakıt tüketimi" },
    { Alan: "MGO Anchor (MT/day)", Zorunlu: "Hayır", Açıklama: "Anker gemi sırasında MGO yakıt tüketimi" },
    { Alan: "FO Idle (MT/day)", Zorunlu: "Hayır", Açıklama: "Boşta gemi sırasında FO yakıt tüketimi" },
    { Alan: "MGO Idle (MT/day)", Zorunlu: "Hayır", Açıklama: "Boşta gemi sırasında MGO yakıt tüketimi" },
    { Alan: "Particulars Dosyası", Zorunlu: "Hayır", Açıklama: "Geminin teknik özelliklerini içeren dosya URL'si" },
    { Alan: "Yakıt Tüketim Dosyası", Zorunlu: "Hayır", Açıklama: "Geminin yakıt tüketimini içeren dosya URL'si" },
    { Alan: "Filo", Zorunlu: "Hayır", Açıklama: "Geminin filo adı" },
    { Alan: "Şirket", Zorunlu: "Hayır", Açıklama: "Geminin şirket adı" },
  ]

  const wsInstructions = XLSX.utils.json_to_sheet(instructions)
  XLSX.utils.book_append_sheet(wb, wsInstructions, "Talimatlar")

  XLSX.writeFile(wb, "gemiler_sablonu.xlsx")
}

export function parseShipsExcel(file: File): Promise<ShipExcelData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: "binary" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        const ships: ShipExcelData[] = jsonData.map((row: any) => ({
          name: row["Gemi Adı"] || row["name"],
          imo_number: row["IMO Numarası"] || row["imo_number"],
          flag: row["Bayrak"] || row["flag"],
          vessel_type: row["Gemi Tipi"] || row["vessel_type"],
          dwt: row["DWT (MT)"] || row["dwt"],
          grt: row["GRT"] || row["grt"],
          nrt: row["NRT"] || row["nrt"],
          built_year: row["İnşa Yılı"] || row["built_year"],
          loa: row["LOA (m)"] || row["loa"],
          beam: row["Beam (m)"] || row["beam"],
          draft: row["Draft (m)"] || row["draft"],
          main_engine: row["Ana Makine"] || row["main_engine"],
          engine_power: row["Makine Gücü"] || row["engine_power"],
          speed_laden: row["Yüklü Hız (knot)"] || row["speed_laden"],
          speed_ballast: row["Boş Hız (knot)"] || row["speed_ballast"],
          status: row["Durum"] || row["status"] || "active",
          current_position: row["Mevcut Pozisyon"] || row["current_position"],
          fleet_id: row["Filo ID"] || row["fleet_id"],
          latitude: row["Enlem"] || row["latitude"],
          longitude: row["Boylam"] || row["longitude"],
          consumption_operations: {
            loading: {
              fo: row["FO Loading (MT/day)"] || row["consumption_operations.loading.fo"],
              mgo: row["MGO Loading (MT/day)"] || row["consumption_operations.loading.mgo"],
            },
            discharge: {
              fo: row["FO Discharge (MT/day)"] || row["consumption_operations.discharge.fo"],
              mgo: row["MGO Discharge (MT/day)"] || row["consumption_operations.discharge.mgo"],
            },
            laden: {
              fo: row["FO Laden (MT/day)"] || row["consumption_operations.laden.fo"],
              mgo: row["MGO Laden (MT/day)"] || row["consumption_operations.laden.mgo"],
            },
            ballast: {
              fo: row["FO Ballast (MT/day)"] || row["consumption_operations.ballast.fo"],
              mgo: row["MGO Ballast (MT/day)"] || row["consumption_operations.ballast.mgo"],
            },
            anchor: {
              fo: row["FO Anchor (MT/day)"] || row["consumption_operations.anchor.fo"],
              mgo: row["MGO Anchor (MT/day)"] || row["consumption_operations.anchor.mgo"],
            },
            idle: {
              fo: row["FO Idle (MT/day)"] || row["consumption_operations.idle.fo"],
              mgo: row["MGO Idle (MT/day)"] || row["consumption_operations.idle.mgo"],
            },
          },
          particulars_file_url: row["Particulars Dosyası"] || row["particulars_file_url"],
          fuel_consumption_file_url: row["Yakıt Tüketim Dosyası"] || row["fuel_consumption_file_url"],
          fleet_name: row["Filo"] || row["fleet_name"],
          company_name: row["Şirket"] || row["company_name"],
        }))

        resolve(ships)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(new Error("Dosya okunamadı"))
    reader.readAsBinaryString(file)
  })
}

export function exportShipsToExcel(ships: any[]) {
  const data = ships.map((ship) => ({
    "Gemi Adı": ship.name,
    "IMO Numarası": ship.imo_number || "",
    Bayrak: ship.flag || "",
    "Gemi Tipi": ship.vessel_type || "",
    "DWT (MT)": ship.dwt || "",
    GRT: ship.grt || "",
    NRT: ship.nrt || "",
    "İnşa Yılı": ship.built_year || "",
    "LOA (m)": ship.loa || "",
    "Beam (m)": ship.beam || "",
    "Draft (m)": ship.draft || "",
    "Ana Makine": ship.main_engine || "",
    "Makine Gücü": ship.engine_power || "",
    "Yüklü Hız (knot)": ship.speed_laden || "",
    "Boş Hız (knot)": ship.speed_ballast || "",
    Durum: ship.status,
    "Mevcut Pozisyon": ship.current_position || "",
    Enlem: ship.latitude || "",
    Boylam: ship.longitude || "",
    "FO Loading (MT/day)": ship.consumption_operations?.loading?.fo || "",
    "MGO Loading (MT/day)": ship.consumption_operations?.loading?.mgo || "",
    "FO Discharge (MT/day)": ship.consumption_operations?.discharge?.fo || "",
    "MGO Discharge (MT/day)": ship.consumption_operations?.discharge?.mgo || "",
    "FO Laden (MT/day)": ship.consumption_operations?.laden?.fo || "",
    "MGO Laden (MT/day)": ship.consumption_operations?.laden?.mgo || "",
    "FO Ballast (MT/day)": ship.consumption_operations?.ballast?.fo || "",
    "MGO Ballast (MT/day)": ship.consumption_operations?.ballast?.mgo || "",
    "FO Anchor (MT/day)": ship.consumption_operations?.anchor?.fo || "",
    "MGO Anchor (MT/day)": ship.consumption_operations?.anchor?.mgo || "",
    "FO Idle (MT/day)": ship.consumption_operations?.idle?.fo || "",
    "MGO Idle (MT/day)": ship.consumption_operations?.idle?.mgo || "",
    "Particulars Dosyası": ship.particulars_file_url || "",
    "Yakıt Tüketim Dosyası": ship.fuel_consumption_file_url || "",
    Filo: ship.fleet_name || "",
    Şirket: ship.company_name || "",
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Gemiler")

  const fileName = `gemiler_${new Date().toISOString().split("T")[0]}.xlsx`
  XLSX.writeFile(wb, fileName)
}
