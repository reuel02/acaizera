/**
 * ================================================
 * SERVICE: gerarPix
 * ================================================
 *
 * Gera payload PIX completo com checksum CRC16
 * Payload pode ser convertido em QR Code para escaneamento
 *
 * FUNCIONALIDADE:
 *  1. Recebe dados: chave PIX, nome recebedor, cidade, valor
 *  2. Limpa caracteres especiais (acentos → sem acento)
 *  3. Constrói payload PIX em formato padrão BCPS (Banco Central)
 *  4. Calcula checksum CRC16 CCITT-FALSE para validação
 *  5. Retorna payload completo para QR Code
 *
 * PADRÃO PIX (BR):
 *  - Formato: string com campos estruturados
 *  - Cada campo começa com código (26, 52, 53, 54, 58, 59, 60, 62, 63)
 *  - Seguido de tamanho do valor e o valor em si
 *  - Exemplo: "26XX0014br.gov.bcb..." (26 = Merchant Account Info)
 *
 * @param chavePix - Chave PIX registrada (email, CPF, telefone ou aleatória)
 * @param recebedor - Nome completo de quem recebe (sem acentos no payload)
 * @param cidade - Cidade onde recebedor está registrado
 * @param valorTotal - Valor em reais (ex: 19.90)
 *
 * @returns payload - String completa para QR Code (ex: "00020126...")
 *
 * SECURITY NOTES:
 *  - ⚠️ Chave PIX passada via props (não deve estar hardcoded em src/)
 *  - 🔐 Future: Validar formato de chave PIX
 *
 * TÉCNICA:
 *  - Normalize 'NFD': decompõe caracteres com acento
 *  - Regex remove marcas diacríticas (acentos, til, etc)
 *  - CRC16: verifica integridade do payload para scanner
 * ================================================
 */

export function gerarPayloadPix(chavePix, recebedor, cidade, valorTotal) {
  /**
   * Helper: Valida número com 2 casas decimais
   * Exemplo: 19.9 → "19.90"
   */
  const formatarValor = (valor) => Number(valor).toFixed(2).toString();

  /**
   * Helper: Remove acentos e caracteres especiais
   * Converte para maiúsculo (padrão PIX)
   * Exemplo: "João" → "JOAO"
   */
  const limparString = (str) =>
    str
      .normalize("NFD") // Decompõe caracteres com acento (á → a + ´)
      .replace(/[\u0300-\u036f]/g, "") // Remove marcas diacríticas
      .toUpperCase(); // Maiúsculo para PIX

  // Limpa nome e cidade
  const nomeLimpo = limparString(recebedor);
  const cidadeLimpa = limparString(cidade);

  // ===== CONSTRUÇÃO DO PAYLOAD PIX (Padrão BCPS) =====

  // Campo 00: Payload Format Indicator (sempre "000201")
  const payloadFormatIndicator = "000201";

  // Campo 26: Merchant Account Information (dados da chave PIX)
  // Formato: "26" + tamanho + "0014br.gov.bcb.pix01" + tamanho_chave + chave
  const merchantAccountInformation = `26${(chavePix.length + 22).toString().padStart(2, "0")}0014br.gov.bcb.pix01${chavePix.length.toString().padStart(2, "0")}${chavePix}`;

  // Campo 52: Merchant Category Code (sempre "52040000" = serviços em geral)
  const merchantCategoryCode = "52040000";

  // Campo 53: Transaction Currency (sempre "5303986" = Real BRL)
  const transactionCurrency = "5303986";

  // Campo 54: Transaction Amount (valor da compra)
  // Formato: "54" + tamanho + valor_com_2_decimais
  const transactionAmount = `54${formatarValor(valorTotal).length.toString().padStart(2, "0")}${formatarValor(valorTotal)}`;

  // Campo 58: Country Code (sempre "5802BR" = Brasil)
  const countryCode = "5802BR";

  // Campo 59: Merchant Name (nome do recebedor)
  // Formato: "59" + tamanho + nome_limpo
  const merchantName = `59${nomeLimpo.length.toString().padStart(2, "0")}${nomeLimpo}`;

  // Campo 60: Merchant City (cidade do recebedor)
  // Formato: "60" + tamanho + cidade_limpa
  const merchantCity = `60${cidadeLimpa.length.toString().padStart(2, "0")}${cidadeLimpa}`;

  // Campo 62: Additional Data Field Template (referência do pagamento)
  const additionalDataFieldTemplate = "62070503***";

  // Monta payload sem CRC (será adicionado depois)
  const payload =
    payloadFormatIndicator +
    merchantAccountInformation +
    merchantCategoryCode +
    transactionCurrency +
    transactionAmount +
    countryCode +
    merchantName +
    merchantCity +
    additionalDataFieldTemplate;

  /**
   * Calcula CRC16 CCITT-FALSE (checksum para validação do QR Code)
   *
   * ALGORITMO:
   * 1. Inicia CRC em 0xFFFF
   * 2. Para cada caractere:
   *    - XOR com valor ASCII deslocado 8 bits
   *    - 8 iterações de shift esquerda + XOR opcional
   * 3. Mantém resultado em 16 bits
   *
   * @param str - Payload sem checksum ("...6304")
   * @returns checksum - 4 caracteres hexadecimais em maiúsculo
   */
  const calcularCRC16 = (str) => {
    let crc = 0xffff; // Valor inicial padrão CRC16

    // Processa cada caractere do payload
    for (let i = 0; i < str.length; i++) {
      // XOR com valor ASCII do caractere (deslocado 8 bits)
      crc ^= str.charCodeAt(i) << 8;

      // 8 iterações do algoritmo CRC
      for (let j = 0; j < 8; j++) {
        // Se bit mais significativo = 1, XOR com polinômio
        if (crc & 0x8000) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          // Caso contrário, apenas desloca esquerda
          crc <<= 1;
        }

        // Mantém resultado em 16 bits
        crc &= 0xffff;
      }
    }

    // Converte para hexadecimal, maiúsculo, com padding de 4 caracteres
    return crc.toString(16).toUpperCase().padStart(4, "0");
  };

  // ===== ADICIONA CRC AO PAYLOAD =====
  // Campo 63: Checksum for CRC16
  // Formato: "6304" + checksum_4_hex
  const payloadComCrcId = payload + "6304";
  return payloadComCrcId + calcularCRC16(payloadComCrcId);
}
