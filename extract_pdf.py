#!/usr/bin/env python3
"""
Extract product data from PDF using PyPDF2 - same logic as the original Python script
"""

import PyPDF2
import re
import json

def extract_prices(line):
    """Find all prices in Brazilian format (1.234,56)"""
    pattern = r'\d{1,3}(?:\.\d{3})*,\d{2}'
    matches = re.findall(pattern, line)
    return matches

def parse_price(price_str):
    """Convert Brazilian price (1.234,56) to float (1234.56)"""
    cleaned = price_str.replace('.', '').replace(',', '.')
    return float(cleaned)

def extract_products_from_pdf(pdf_path):
    """Extract products from PDF exactly like the Python script"""
    products = []
    
    try:
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ""
            
            # Extract text from all pages
            for page_num in range(len(reader.pages)):
                page = reader.pages[page_num]
                text += page.extract_text() + "\n"
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return products
    
    linhas = text.split('\n')
    
    # Regex pattern for Brazilian prices
    padrao_preco = r'^\d{1,3}(?:\.\d{3})*,\d{2}$'
    
    print(f"Total lines: {len(linhas)}")
    
    lines_with_prices = 0
    lines_with_enough_prices = 0
    
    for linha in linhas:
        if not linha.strip() or 'Descrição' in linha or 'Venda' in linha:
            continue
        
        # Find all prices in line
        prices_in_line = extract_prices(linha)
        
        if len(prices_in_line) > 0:
            lines_with_prices += 1
        
        # Need at least 5 prices (like Python script)
        if len(prices_in_line) < 5:
            continue
        
        lines_with_enough_prices += 1
        
        # Split line into columns
        colunas = linha.split()
        indices_precos = []
        
        # Find price column indices
        for i, col in enumerate(colunas):
            if re.match(padrao_preco, col):
                indices_precos.append(i)
        
        # Check again if we have at least 5 prices
        if len(indices_precos) < 5:
            continue
        
        try:
            # Extract fields like Python script
            fabricante = colunas[2] if len(colunas) > 2 else ""
            descricao_end_idx = indices_precos[0] if indices_precos else len(colunas)
            descricao = ' '.join(colunas[3:descricao_end_idx]) if descricao_end_idx > 3 else ""
            
            if not fabricante or not descricao:
                continue
            
            # Get prices at specific indices (like Python)
            preco_revenda = colunas[indices_precos[3]] if len(indices_precos) > 3 else "0,00"
            preco_revenda_ipi = colunas[indices_precos[5]] if len(indices_precos) > 5 else "0,00"
            
            # Also get final prices
            preco_final = colunas[indices_precos[0]] if indices_precos else "0,00"
            preco_final_ipi = colunas[indices_precos[2]] if len(indices_precos) > 2 else "0,00"
            
            product = {
                'code': colunas[0] if colunas else "",
                'description': descricao.strip(),
                'manufacturer': fabricante,
                'finalPrice': parse_price(preco_final),
                'finalPriceWithIPI': parse_price(preco_final_ipi),
                'resalePrice': parse_price(preco_revenda),
                'resalePriceWithIPI': parse_price(preco_revenda_ipi),
                'ipiPercent': 9.75  # Default, could be calculated
            }
            
            products.append(product)
            
        except Exception as e:
            # Skip lines that fail
            continue
    
    print(f"Lines with prices: {lines_with_prices}")
    print(f"Lines with >= 5 prices: {lines_with_enough_prices}")
    print(f"Products extracted: {len(products)}")
    
    return products

if __name__ == '__main__':
    pdf_path = "./Tabela de Preços.pdf"
    products = extract_products_from_pdf(pdf_path)
    
    # Save to JSON
    output_path = "./extracted_products.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(products, f, indent=2, ensure_ascii=False)
    
    print(f"\nExtracted {len(products)} products")
    print(f"Saved to: {output_path}")
    
    # Show first 5 products
    if products:
        print("\nFirst 5 products:")
        for i, p in enumerate(products[:5]):
            print(f"  {i+1}. [{p['code']}] {p['description']}")
