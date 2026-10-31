package uni.AEDLab1.services;

import org.springframework.stereotype.Service;
import uni.AEDLab1.models.FotogramaNotacionPolacaDto;
import uni.AEDLab1.models.NotacionPolacaPeticionDto;
import uni.AEDLab1.models.NotacionPolacaRespuestaDto;
import uni.AEDLab1.models.PasoNotacionPolacaDto;

import java.util.Arrays;

@Service
public class NotacionPolacaServicio {

    public static final int MAX_PILA = 100;
    public static final int MAX_PASOS = 100;
    public static final int MAX_FOTOGRAMAS = 500;

    public NotacionPolacaRespuestaDto convertir(NotacionPolacaPeticionDto peticion) {
        if (peticion == null || peticion.expresion() == null) {
            throw new IllegalArgumentException("La expresión no puede ser nula.");
        }

        String modalidad = peticion.modalidad() != null ? peticion.modalidad().trim().toLowerCase() : "prefijo";
        if (!modalidad.equals("prefijo") && !modalidad.equals("postfijo")) {
            throw new IllegalArgumentException("Modalidad no válida. Debe ser 'prefijo' o 'postfijo'.");
        }

        String limpia = peticion.expresion().trim().toUpperCase();
        validarExpresion(limpia);

        String exprSinEspacios = limpia.replaceAll("\\s+", "");

        ResultadoConversion res;
        if (modalidad.equals("postfijo")) {
            res = convertirAPostfija(exprSinEspacios);
        } else {
            res = convertirAPrefija(exprSinEspacios);
        }

        return new NotacionPolacaRespuestaDto(
            limpia,
            res.resultado(),
            modalidad,
            res.pasos().length,
            res.pasos(),
            res.fotogramas()
        );
    }

    public void validarExpresion(String expr) {
        String limpia = expr.replaceAll("\\s+", "");
        if (limpia.isEmpty()) {
            throw new IllegalArgumentException("Ingrese una expresión algebraica infija.");
        }

        // Caracteres permitidos: letras A-Z y operadores PEMDAS
        for (int i = 0; i < limpia.length(); i++) {
            char c = limpia.charAt(i);
            if (!(c >= 'A' && c <= 'Z') && "+-*/^()".indexOf(c) == -1) {
                throw new IllegalArgumentException("Carácter no permitido: '" + c + "'. Solo se permiten letras (A-Z) y operadores PEMDAS: ( ), ^, *, /, +, -.");
            }
        }

        // Balanceo de paréntesis
        int profundidad = 0;
        for (int i = 0; i < limpia.length(); i++) {
            char c = limpia.charAt(i);
            if (c == '(') profundidad++;
            if (c == ')') profundidad--;
            if (profundidad < 0) {
                throw new IllegalArgumentException("Paréntesis desbalanceados: existe un paréntesis de cierre ')' sin apertura.");
            }
        }
        if (profundidad != 0) {
            throw new IllegalArgumentException("Paréntesis desbalanceados: falta cerrar paréntesis '('.");
        }

        // Paréntesis vacíos
        if (limpia.contains("()")) {
            throw new IllegalArgumentException("Los paréntesis no pueden estar vacíos: '()'.");
        }

        // Operadores consecutivos
        if (limpia.matches(".*[+\\-*/^]{2,}.*")) {
            throw new IllegalArgumentException("Sintaxis inválida: no se permiten operadores consecutivos.");
        }

        // Operador al inicio o al final
        if (limpia.matches("^[+\\-*/^].*")) {
            throw new IllegalArgumentException("La expresión no puede comenzar con un operador.");
        }
        if (limpia.matches(".*[+\\-*/^]$")) {
            throw new IllegalArgumentException("La expresión no puede terminar con un operador.");
        }

        // Operador inmediatamente después de '(' o antes de ')'
        if (limpia.matches(".*\\([+\\-*/^].*")) {
            throw new IllegalArgumentException("Sintaxis inválida: operador inmediatamente después de apertura '('.");
        }
        if (limpia.matches(".*[+\\-*/^]\\).*")) {
            throw new IllegalArgumentException("Sintaxis inválida: operador inmediatamente antes de cierre ')'.");
        }

        // Operandos adyacentes o falta de operadores con paréntesis
        if (limpia.matches(".*[A-Z]{2,}.*")) {
            throw new IllegalArgumentException("Falta un operador entre operandos consecutivos.");
        }
        if (limpia.matches(".*[A-Z]\\(.*")) {
            throw new IllegalArgumentException("Falta un operador antes del paréntesis '(' (ej. A*(B+C)).");
        }
        if (limpia.matches(".*\\)[A-Z].*")) {
            throw new IllegalArgumentException("Falta un operador después del paréntesis ')' (ej. (A+B)*C).");
        }
        if (limpia.matches(".*\\)\\(.*")) {
            throw new IllegalArgumentException("Falta un operador entre paréntesis adyacentes ')('.");
        }

        // Al menos un operando
        if (!limpia.matches(".*[A-Z].*")) {
            throw new IllegalArgumentException("La expresión debe contener al menos un operando (A-Z).");
        }
    }

    public int prioridad(String operador) {
        return switch (operador) {
            case "^" -> 4;
            case "*", "/" -> 3;
            case "+", "-" -> 2;
            default -> 1; // Para '(' o ')' dentro de la pila
        };
    }

    // ========================================================
    // ESTRUCTURAS BASADAS EXCLUSIVAMENTE EN ARREGLOS ESTÁTICOS
    // ========================================================

    static class Token {
        String text;
        String type; // "operand", "operator", "paren"

        Token(String text, String type) {
            this.text = text;
            this.type = type;
        }
    }

    record ValItem(int startIdx, int endIdx, String converted) {}
    record ResultadoConversion(String resultado, PasoNotacionPolacaDto[] pasos, FotogramaNotacionPolacaDto[] fotogramas) {}

    private int findPrevTokenIdx(Token[] tokens, int fromIdx) {
        for (int i = fromIdx - 1; i >= 0; i--) {
            if (tokens[i] != null) return i;
        }
        return -1;
    }

    private int findNextTokenIdx(Token[] tokens, int fromIdx, int totalTokens) {
        for (int i = fromIdx + 1; i < totalTokens; i++) {
            if (tokens[i] != null) return i;
        }
        return -1;
    }

    private void replaceRange(Token[] tokens, int startIdx, int endIdx, Token nuevo) {
        tokens[startIdx] = nuevo;
        for (int i = startIdx + 1; i <= endIdx; i++) {
            tokens[i] = null;
        }
    }

    private String formatTokens(Token[] tokens, int totalTokens) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < totalTokens; i++) {
            Token t = tokens[i];
            if (t == null) continue;
            if (sb.length() == 0) {
                sb.append(t.text);
            } else {
                char lastChar = sb.charAt(sb.length() - 1);
                if (t.text.equals(")") || lastChar == '(') {
                    sb.append(t.text);
                } else {
                    sb.append(" ").append(t.text);
                }
            }
        }
        return sb.toString();
    }

    private PasoNotacionPolacaDto[] registrarPaso(PasoNotacionPolacaDto[] arr, int idx, PasoNotacionPolacaDto paso) {
        if (idx >= arr.length) {
            arr = Arrays.copyOf(arr, arr.length * 2);
        }
        arr[idx] = paso;
        return arr;
    }

    private FotogramaNotacionPolacaDto[] registrarFotograma(FotogramaNotacionPolacaDto[] arr, int idx, FotogramaNotacionPolacaDto foto) {
        if (idx >= arr.length) {
            arr = Arrays.copyOf(arr, arr.length * 2);
        }
        arr[idx] = foto;
        return arr;
    }

    private ResultadoConversion convertirAPostfija(String ei) {
        int totalTokens = ei.length();
        Token[] tokens = new Token[totalTokens];
        for (int i = 0; i < totalTokens; i++) {
            String c = ei.substring(i, i + 1);
            String type = "operand";
            if ("+-*/^".contains(c)) type = "operator";
            if ("()".contains(c)) type = "paren";
            tokens[i] = new Token(c, type);
        }

        String[] pila = new String[MAX_PILA];
        int topePila = -1;

        ValItem[] pilaValores = new ValItem[MAX_PILA];
        int topeValores = -1;

        PasoNotacionPolacaDto[] pasos = new PasoNotacionPolacaDto[MAX_PASOS];
        int totalPasos = 0;

        FotogramaNotacionPolacaDto[] fotogramas = new FotogramaNotacionPolacaDto[MAX_FOTOGRAMAS];
        int totalFotogramas = 0;

        int numeroPaso = 0;
        StringBuilder epos = new StringBuilder();

        for (int currIdx = 0; currIdx < totalTokens; currIdx++) {
            Token currToken = tokens[currIdx];
            String simb = currToken.text;

            if (simb.equals("(")) {
                pila[++topePila] = simb;
                fotogramas = registrarFotograma(fotogramas, totalFotogramas++,
                    new FotogramaNotacionPolacaDto("push", simb, Arrays.copyOf(pila, topePila + 1), null));
            } else if (simb.equals(")")) {
                while (topePila >= 0 && !pila[topePila].equals("(")) {
                    String extraido = pila[topePila--];
                    fotogramas = registrarFotograma(fotogramas, totalFotogramas++,
                        new FotogramaNotacionPolacaDto("pop", extraido, Arrays.copyOf(pila, topePila + 1), null));
                    epos.append(extraido);

                    ValItem der = topeValores >= 0 ? pilaValores[topeValores--] : new ValItem(-1, -1, "");
                    ValItem izq = topeValores >= 0 ? pilaValores[topeValores--] : new ValItem(-1, -1, "");
                    String convertido = izq.converted() + der.converted() + extraido;

                    int startIdx = izq.startIdx() != -1 ? izq.startIdx() : der.startIdx();
                    int endIdx = der.endIdx() != -1 ? der.endIdx() : izq.endIdx();

                    boolean consumeParens = (topePila == -1 || pila[topePila].equals("("));
                    if (consumeParens && startIdx != -1 && endIdx != -1) {
                        int prevIdx = findPrevTokenIdx(tokens, startIdx);
                        int nextIdx = findNextTokenIdx(tokens, endIdx, totalTokens);
                        if (prevIdx != -1 && tokens[prevIdx].text.equals("(") &&
                            nextIdx != -1 && tokens[nextIdx].text.equals(")")) {
                            startIdx = prevIdx;
                            endIdx = nextIdx;
                        }
                    }

                    Token nuevoToken = new Token(convertido, "operand");
                    if (startIdx != -1 && endIdx != -1) {
                        replaceRange(tokens, startIdx, endIdx, nuevoToken);
                    }
                    pilaValores[++topeValores] = new ValItem(startIdx, endIdx, convertido);

                    numeroPaso++;
                    String expresionCompleta = formatTokens(tokens, totalTokens);
                    PasoNotacionPolacaDto paso = new PasoNotacionPolacaDto(
                        numeroPaso, extraido, izq.converted() + " " + extraido + " " + der.converted(), convertido, expresionCompleta
                    );
                    pasos = registrarPaso(pasos, totalPasos++, paso);
                    fotogramas = registrarFotograma(fotogramas, totalFotogramas++,
                        new FotogramaNotacionPolacaDto("step", extraido, Arrays.copyOf(pila, topePila + 1), paso));
                }
                if (topePila >= 0 && pila[topePila].equals("(")) {
                    topePila--;
                    fotogramas = registrarFotograma(fotogramas, totalFotogramas++,
                        new FotogramaNotacionPolacaDto("pop", "(", Arrays.copyOf(pila, topePila + 1), null));
                }
            } else if (currToken.type.equals("operand")) {
                epos.append(simb);
                pilaValores[++topeValores] = new ValItem(currIdx, currIdx, simb);
            } else {
                // Es un operador
                if (topePila >= 0) {
                    while (topePila >= 0 && prioridad(simb) <= prioridad(pila[topePila])) {
                        String extraido = pila[topePila--];
                        fotogramas = registrarFotograma(fotogramas, totalFotogramas++,
                            new FotogramaNotacionPolacaDto("pop", extraido, Arrays.copyOf(pila, topePila + 1), null));
                        epos.append(extraido);

                        ValItem der = topeValores >= 0 ? pilaValores[topeValores--] : new ValItem(-1, -1, "");
                        ValItem izq = topeValores >= 0 ? pilaValores[topeValores--] : new ValItem(-1, -1, "");
                        String convertido = izq.converted() + der.converted() + extraido;

                        int startIdx = izq.startIdx() != -1 ? izq.startIdx() : der.startIdx();
                        int endIdx = der.endIdx() != -1 ? der.endIdx() : izq.endIdx();

                        Token nuevoToken = new Token(convertido, "operand");
                        if (startIdx != -1 && endIdx != -1) {
                            replaceRange(tokens, startIdx, endIdx, nuevoToken);
                        }
                        pilaValores[++topeValores] = new ValItem(startIdx, endIdx, convertido);

                        numeroPaso++;
                        String expresionCompleta = formatTokens(tokens, totalTokens);
                        PasoNotacionPolacaDto paso = new PasoNotacionPolacaDto(
                            numeroPaso, extraido, izq.converted() + " " + extraido + " " + der.converted(), convertido, expresionCompleta
                        );
                        pasos = registrarPaso(pasos, totalPasos++, paso);
                        fotogramas = registrarFotograma(fotogramas, totalFotogramas++,
                            new FotogramaNotacionPolacaDto("step", extraido, Arrays.copyOf(pila, topePila + 1), paso));
                    }
                }
                pila[++topePila] = simb;
                fotogramas = registrarFotograma(fotogramas, totalFotogramas++,
                    new FotogramaNotacionPolacaDto("push", simb, Arrays.copyOf(pila, topePila + 1), null));
            }
        }

        while (topePila >= 0) {
            String extraido = pila[topePila--];
            fotogramas = registrarFotograma(fotogramas, totalFotogramas++,
                new FotogramaNotacionPolacaDto("pop", extraido, Arrays.copyOf(pila, topePila + 1), null));
            if (!extraido.equals("(") && !extraido.equals(")")) {
                epos.append(extraido);

                ValItem der = topeValores >= 0 ? pilaValores[topeValores--] : new ValItem(-1, -1, "");
                ValItem izq = topeValores >= 0 ? pilaValores[topeValores--] : new ValItem(-1, -1, "");
                String convertido = izq.converted() + der.converted() + extraido;

                int startIdx = izq.startIdx() != -1 ? izq.startIdx() : der.startIdx();
                int endIdx = der.endIdx() != -1 ? der.endIdx() : izq.endIdx();

                Token nuevoToken = new Token(convertido, "operand");
                if (startIdx != -1 && endIdx != -1) {
                    replaceRange(tokens, startIdx, endIdx, nuevoToken);
                }
                pilaValores[++topeValores] = new ValItem(startIdx, endIdx, convertido);

                numeroPaso++;
                String expresionCompleta = formatTokens(tokens, totalTokens);
                PasoNotacionPolacaDto paso = new PasoNotacionPolacaDto(
                    numeroPaso, extraido, izq.converted() + " " + extraido + " " + der.converted(), convertido, expresionCompleta
                );
                pasos = registrarPaso(pasos, totalPasos++, paso);
                fotogramas = registrarFotograma(fotogramas, totalFotogramas++,
                    new FotogramaNotacionPolacaDto("step", extraido, Arrays.copyOf(pila, topePila + 1), paso));
            }
        }

        return new ResultadoConversion(
            epos.toString(),
            Arrays.copyOf(pasos, totalPasos),
            Arrays.copyOf(fotogramas, totalFotogramas)
        );
    }

    private ResultadoConversion convertirAPrefija(String ei) {
        int totalTokens = ei.length();
        Token[] tokens = new Token[totalTokens];
        for (int i = 0; i < totalTokens; i++) {
            String c = ei.substring(i, i + 1);
            String type = "operand";
            if ("+-*/^".contains(c)) type = "operator";
            if ("()".contains(c)) type = "paren";
            tokens[i] = new Token(c, type);
        }

        String[] pila = new String[MAX_PILA];
        int topePila = -1;

        ValItem[] pilaValores = new ValItem[MAX_PILA];
        int topeValores = -1;

        PasoNotacionPolacaDto[] pasos = new PasoNotacionPolacaDto[MAX_PASOS];
        int totalPasos = 0;

        FotogramaNotacionPolacaDto[] fotogramas = new FotogramaNotacionPolacaDto[MAX_FOTOGRAMAS];
        int totalFotogramas = 0;

        int numeroPaso = 0;
        StringBuilder epre = new StringBuilder();

        for (int currIdx = totalTokens - 1; currIdx >= 0; currIdx--) {
            Token currToken = tokens[currIdx];
            String simb = currToken.text;

            if (simb.equals(")")) {
                pila[++topePila] = simb;
                fotogramas = registrarFotograma(fotogramas, totalFotogramas++,
                    new FotogramaNotacionPolacaDto("push", simb, Arrays.copyOf(pila, topePila + 1), null));
            } else if (simb.equals("(")) {
                while (topePila >= 0 && !pila[topePila].equals(")")) {
                    String extraido = pila[topePila--];
                    fotogramas = registrarFotograma(fotogramas, totalFotogramas++,
                        new FotogramaNotacionPolacaDto("pop", extraido, Arrays.copyOf(pila, topePila + 1), null));
                    epre.append(extraido);

                    ValItem izq = topeValores >= 0 ? pilaValores[topeValores--] : new ValItem(-1, -1, "");
                    ValItem der = topeValores >= 0 ? pilaValores[topeValores--] : new ValItem(-1, -1, "");
                    String convertido = extraido + izq.converted() + der.converted();

                    int startIdx = izq.startIdx() != -1 ? izq.startIdx() : der.startIdx();
                    int endIdx = der.endIdx() != -1 ? der.endIdx() : izq.endIdx();

                    boolean consumeParens = (topePila == -1 || pila[topePila].equals(")"));
                    if (consumeParens && startIdx != -1 && endIdx != -1) {
                        int prevIdx = findPrevTokenIdx(tokens, startIdx);
                        int nextIdx = findNextTokenIdx(tokens, endIdx, totalTokens);
                        if (prevIdx != -1 && tokens[prevIdx].text.equals("(") &&
                            nextIdx != -1 && tokens[nextIdx].text.equals(")")) {
                            startIdx = prevIdx;
                            endIdx = nextIdx;
                        }
                    }

                    Token nuevoToken = new Token(convertido, "operand");
                    if (startIdx != -1 && endIdx != -1) {
                        replaceRange(tokens, startIdx, endIdx, nuevoToken);
                    }
                    pilaValores[++topeValores] = new ValItem(startIdx, endIdx, convertido);

                    numeroPaso++;
                    String expresionCompleta = formatTokens(tokens, totalTokens);
                    PasoNotacionPolacaDto paso = new PasoNotacionPolacaDto(
                        numeroPaso, extraido, izq.converted() + " " + extraido + " " + der.converted(), convertido, expresionCompleta
                    );
                    pasos = registrarPaso(pasos, totalPasos++, paso);
                    fotogramas = registrarFotograma(fotogramas, totalFotogramas++,
                        new FotogramaNotacionPolacaDto("step", extraido, Arrays.copyOf(pila, topePila + 1), paso));
                }
                if (topePila >= 0 && pila[topePila].equals(")")) {
                    topePila--;
                    fotogramas = registrarFotograma(fotogramas, totalFotogramas++,
                        new FotogramaNotacionPolacaDto("pop", ")", Arrays.copyOf(pila, topePila + 1), null));
                }
            } else if (currToken.type.equals("operand")) {
                epre.append(simb);
                pilaValores[++topeValores] = new ValItem(currIdx, currIdx, simb);
            } else {
                // Es un operador
                if (topePila >= 0) {
                    while (topePila >= 0 && prioridad(simb) < prioridad(pila[topePila])) {
                        String extraido = pila[topePila--];
                        fotogramas = registrarFotograma(fotogramas, totalFotogramas++,
                            new FotogramaNotacionPolacaDto("pop", extraido, Arrays.copyOf(pila, topePila + 1), null));
                        epre.append(extraido);

                        ValItem izq = topeValores >= 0 ? pilaValores[topeValores--] : new ValItem(-1, -1, "");
                        ValItem der = topeValores >= 0 ? pilaValores[topeValores--] : new ValItem(-1, -1, "");
                        String convertido = extraido + izq.converted() + der.converted();

                        int startIdx = izq.startIdx() != -1 ? izq.startIdx() : der.startIdx();
                        int endIdx = der.endIdx() != -1 ? der.endIdx() : izq.endIdx();

                        Token nuevoToken = new Token(convertido, "operand");
                        if (startIdx != -1 && endIdx != -1) {
                            replaceRange(tokens, startIdx, endIdx, nuevoToken);
                        }
                        pilaValores[++topeValores] = new ValItem(startIdx, endIdx, convertido);

                        numeroPaso++;
                        String expresionCompleta = formatTokens(tokens, totalTokens);
                        PasoNotacionPolacaDto paso = new PasoNotacionPolacaDto(
                            numeroPaso, extraido, izq.converted() + " " + extraido + " " + der.converted(), convertido, expresionCompleta
                        );
                        pasos = registrarPaso(pasos, totalPasos++, paso);
                        fotogramas = registrarFotograma(fotogramas, totalFotogramas++,
                            new FotogramaNotacionPolacaDto("step", extraido, Arrays.copyOf(pila, topePila + 1), paso));
                    }
                }
                pila[++topePila] = simb;
                fotogramas = registrarFotograma(fotogramas, totalFotogramas++,
                    new FotogramaNotacionPolacaDto("push", simb, Arrays.copyOf(pila, topePila + 1), null));
            }
        }

        while (topePila >= 0) {
            String extraido = pila[topePila--];
            fotogramas = registrarFotograma(fotogramas, totalFotogramas++,
                new FotogramaNotacionPolacaDto("pop", extraido, Arrays.copyOf(pila, topePila + 1), null));
            if (!extraido.equals("(") && !extraido.equals(")")) {
                epre.append(extraido);

                ValItem izq = topeValores >= 0 ? pilaValores[topeValores--] : new ValItem(-1, -1, "");
                ValItem der = topeValores >= 0 ? pilaValores[topeValores--] : new ValItem(-1, -1, "");
                String convertido = extraido + izq.converted() + der.converted();

                int startIdx = izq.startIdx() != -1 ? izq.startIdx() : der.startIdx();
                int endIdx = der.endIdx() != -1 ? der.endIdx() : izq.endIdx();

                Token nuevoToken = new Token(convertido, "operand");
                if (startIdx != -1 && endIdx != -1) {
                    replaceRange(tokens, startIdx, endIdx, nuevoToken);
                }
                pilaValores[++topeValores] = new ValItem(startIdx, endIdx, convertido);

                numeroPaso++;
                String expresionCompleta = formatTokens(tokens, totalTokens);
                PasoNotacionPolacaDto paso = new PasoNotacionPolacaDto(
                    numeroPaso, extraido, izq.converted() + " " + extraido + " " + der.converted(), convertido, expresionCompleta
                );
                pasos = registrarPaso(pasos, totalPasos++, paso);
                fotogramas = registrarFotograma(fotogramas, totalFotogramas++,
                    new FotogramaNotacionPolacaDto("step", extraido, Arrays.copyOf(pila, topePila + 1), paso));
            }
        }

        return new ResultadoConversion(
            epre.reverse().toString(),
            Arrays.copyOf(pasos, totalPasos),
            Arrays.copyOf(fotogramas, totalFotogramas)
        );
    }
}
