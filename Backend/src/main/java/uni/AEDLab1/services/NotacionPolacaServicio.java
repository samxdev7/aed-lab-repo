package uni.AEDLab1.services;

import org.springframework.stereotype.Service;
import uni.AEDLab1.models.FotogramaNotacionPolacaDto;
import uni.AEDLab1.models.NotacionPolacaPeticionDto;
import uni.AEDLab1.models.NotacionPolacaRespuestaDto;
import uni.AEDLab1.models.PasoNotacionPolacaDto;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

@Service
public class NotacionPolacaServicio {

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
        List<FotogramaNotacionPolacaDto> fotogramas = new ArrayList<>();
        List<PasoNotacionPolacaDto> pasos = new ArrayList<>();

        String resultado;
        if (modalidad.equals("postfijo")) {
            resultado = convertirAPostfija(exprSinEspacios, fotogramas, pasos);
        } else {
            resultado = convertirAPrefija(exprSinEspacios, fotogramas, pasos);
        }

        return new NotacionPolacaRespuestaDto(
            limpia,
            resultado,
            modalidad,
            pasos.size(),
            pasos,
            fotogramas
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

    static class TokenNode {
        String text;
        String type; // "operand", "operator", "paren"
        TokenNode prev;
        TokenNode next;

        TokenNode(String text, String type) {
            this.text = text;
            this.type = type;
        }
    }

    static class TokenList {
        TokenNode head;
        TokenNode tail;

        TokenList(String expr) {
            for (int i = 0; i < expr.length(); i++) {
                String c = expr.substring(i, i + 1);
                String type = "operand";
                if ("+-*/^".contains(c)) type = "operator";
                if ("()".contains(c)) type = "paren";
                append(new TokenNode(c, type));
            }
        }

        void append(TokenNode node) {
            if (head == null) {
                head = node;
                tail = node;
            } else {
                tail.next = node;
                node.prev = tail;
                tail = node;
            }
        }

        void replaceRange(TokenNode startNode, TokenNode endNode, TokenNode newNode) {
            TokenNode before = startNode.prev;
            TokenNode after = endNode.next;

            if (before != null) {
                before.next = newNode;
                newNode.prev = before;
            } else {
                head = newNode;
                newNode.prev = null;
            }

            if (after != null) {
                after.prev = newNode;
                newNode.next = after;
            } else {
                tail = newNode;
                newNode.next = null;
            }
        }

        String format() {
            StringBuilder sb = new StringBuilder();
            TokenNode curr = head;
            while (curr != null) {
                if (sb.length() == 0) {
                    sb.append(curr.text);
                } else {
                    char lastChar = sb.charAt(sb.length() - 1);
                    if (curr.text.equals(")") || lastChar == '(') {
                        sb.append(curr.text);
                    } else {
                        sb.append(" ").append(curr.text);
                    }
                }
                curr = curr.next;
            }
            return sb.toString();
        }
    }

    record ValItem(TokenNode startNode, TokenNode endNode, String converted) {}
    record OpItem(String op, TokenNode tokenNode) {}

    private String convertirAPostfija(
        String ei,
        List<FotogramaNotacionPolacaDto> fotogramas,
        List<PasoNotacionPolacaDto> pasos
    ) {
        TokenList tokenList = new TokenList(ei);
        List<String> pila = new ArrayList<>();
        Deque<OpItem> pilaOpItems = new ArrayDeque<>();
        Deque<ValItem> pilaValores = new ArrayDeque<>();
        int numeroPaso = 0;
        StringBuilder epos = new StringBuilder();

        TokenNode currToken = tokenList.head;
        while (currToken != null) {
            TokenNode nextToken = currToken.next;
            String simb = currToken.text;

            if (simb.equals("(")) {
                pila.add(simb);
                pilaOpItems.push(new OpItem(simb, currToken));
                fotogramas.add(new FotogramaNotacionPolacaDto("push", simb, new ArrayList<>(pila), null));
            } else if (simb.equals(")")) {
                while (!pila.isEmpty() && !pila.get(pila.size() - 1).equals("(")) {
                    String extraido = pila.remove(pila.size() - 1);
                    pilaOpItems.pop();
                    fotogramas.add(new FotogramaNotacionPolacaDto("pop", extraido, new ArrayList<>(pila), null));
                    epos.append(extraido);

                    ValItem der = pilaValores.isEmpty() ? new ValItem(null, null, "") : pilaValores.pop();
                    ValItem izq = pilaValores.isEmpty() ? new ValItem(null, null, "") : pilaValores.pop();
                    String convertido = izq.converted() + der.converted() + extraido;

                    TokenNode startNode = izq.startNode() != null ? izq.startNode() : der.startNode();
                    TokenNode endNode = der.endNode() != null ? der.endNode() : izq.endNode();

                    boolean consumeParens = (pila.isEmpty() || pila.get(pila.size() - 1).equals("("));
                    if (consumeParens && startNode != null && endNode != null &&
                        startNode.prev != null && startNode.prev.text.equals("(") &&
                        endNode.next != null && endNode.next.text.equals(")")) {
                        startNode = startNode.prev;
                        endNode = endNode.next;
                    }

                    TokenNode newNode = new TokenNode(convertido, "operand");
                    if (startNode != null && endNode != null) {
                        tokenList.replaceRange(startNode, endNode, newNode);
                    }
                    pilaValores.push(new ValItem(newNode, newNode, convertido));

                    numeroPaso++;
                    String expresionCompleta = tokenList.format();
                    PasoNotacionPolacaDto paso = new PasoNotacionPolacaDto(
                        numeroPaso, extraido, izq.converted() + " " + extraido + " " + der.converted(), convertido, expresionCompleta
                    );
                    pasos.add(paso);
                    fotogramas.add(new FotogramaNotacionPolacaDto("step", extraido, new ArrayList<>(pila), paso));
                }
                if (!pila.isEmpty() && pila.get(pila.size() - 1).equals("(")) {
                    pila.remove(pila.size() - 1);
                    if (!pilaOpItems.isEmpty()) pilaOpItems.pop();
                    fotogramas.add(new FotogramaNotacionPolacaDto("pop", "(", new ArrayList<>(pila), null));
                }
            } else if (currToken.type.equals("operand")) {
                epos.append(simb);
                pilaValores.push(new ValItem(currToken, currToken, simb));
            } else {
                // Es un operador
                if (!pila.isEmpty()) {
                    while (!pila.isEmpty() && prioridad(simb) <= prioridad(pila.get(pila.size() - 1))) {
                        String extraido = pila.remove(pila.size() - 1);
                        pilaOpItems.pop();
                        fotogramas.add(new FotogramaNotacionPolacaDto("pop", extraido, new ArrayList<>(pila), null));
                        epos.append(extraido);

                        ValItem der = pilaValores.isEmpty() ? new ValItem(null, null, "") : pilaValores.pop();
                        ValItem izq = pilaValores.isEmpty() ? new ValItem(null, null, "") : pilaValores.pop();
                        String convertido = izq.converted() + der.converted() + extraido;

                        TokenNode startNode = izq.startNode() != null ? izq.startNode() : der.startNode();
                        TokenNode endNode = der.endNode() != null ? der.endNode() : izq.endNode();

                        TokenNode newNode = new TokenNode(convertido, "operand");
                        if (startNode != null && endNode != null) {
                            tokenList.replaceRange(startNode, endNode, newNode);
                        }
                        pilaValores.push(new ValItem(newNode, newNode, convertido));

                        numeroPaso++;
                        String expresionCompleta = tokenList.format();
                        PasoNotacionPolacaDto paso = new PasoNotacionPolacaDto(
                            numeroPaso, extraido, izq.converted() + " " + extraido + " " + der.converted(), convertido, expresionCompleta
                        );
                        pasos.add(paso);
                        fotogramas.add(new FotogramaNotacionPolacaDto("step", extraido, new ArrayList<>(pila), paso));

                        if (pila.isEmpty()) break;
                    }
                }
                pila.add(simb);
                pilaOpItems.push(new OpItem(simb, currToken));
                fotogramas.add(new FotogramaNotacionPolacaDto("push", simb, new ArrayList<>(pila), null));
            }

            currToken = nextToken;
        }

        while (!pila.isEmpty()) {
            String extraido = pila.remove(pila.size() - 1);
            if (!pilaOpItems.isEmpty()) pilaOpItems.pop();
            fotogramas.add(new FotogramaNotacionPolacaDto("pop", extraido, new ArrayList<>(pila), null));
            if (!extraido.equals("(") && !extraido.equals(")")) {
                epos.append(extraido);

                ValItem der = pilaValores.isEmpty() ? new ValItem(null, null, "") : pilaValores.pop();
                ValItem izq = pilaValores.isEmpty() ? new ValItem(null, null, "") : pilaValores.pop();
                String convertido = izq.converted() + der.converted() + extraido;

                TokenNode startNode = izq.startNode() != null ? izq.startNode() : der.startNode();
                TokenNode endNode = der.endNode() != null ? der.endNode() : izq.endNode();

                TokenNode newNode = new TokenNode(convertido, "operand");
                if (startNode != null && endNode != null) {
                    tokenList.replaceRange(startNode, endNode, newNode);
                }
                pilaValores.push(new ValItem(newNode, newNode, convertido));

                numeroPaso++;
                String expresionCompleta = tokenList.format();
                PasoNotacionPolacaDto paso = new PasoNotacionPolacaDto(
                    numeroPaso, extraido, izq.converted() + " " + extraido + " " + der.converted(), convertido, expresionCompleta
                );
                pasos.add(paso);
                fotogramas.add(new FotogramaNotacionPolacaDto("step", extraido, new ArrayList<>(pila), paso));
            }
        }

        return epos.toString();
    }

    private String convertirAPrefija(
        String ei,
        List<FotogramaNotacionPolacaDto> fotogramas,
        List<PasoNotacionPolacaDto> pasos
    ) {
        TokenList tokenList = new TokenList(ei);
        List<String> pila = new ArrayList<>();
        Deque<OpItem> pilaOpItems = new ArrayDeque<>();
        Deque<ValItem> pilaValores = new ArrayDeque<>();
        int numeroPaso = 0;
        StringBuilder epre = new StringBuilder();

        TokenNode currToken = tokenList.tail;
        while (currToken != null) {
            TokenNode prevToken = currToken.prev;
            String simb = currToken.text;

            if (simb.equals(")")) {
                pila.add(simb);
                pilaOpItems.push(new OpItem(simb, currToken));
                fotogramas.add(new FotogramaNotacionPolacaDto("push", simb, new ArrayList<>(pila), null));
            } else if (simb.equals("(")) {
                while (!pila.isEmpty() && !pila.get(pila.size() - 1).equals(")")) {
                    String extraido = pila.remove(pila.size() - 1);
                    pilaOpItems.pop();
                    fotogramas.add(new FotogramaNotacionPolacaDto("pop", extraido, new ArrayList<>(pila), null));
                    epre.append(extraido);

                    ValItem izq = pilaValores.isEmpty() ? new ValItem(null, null, "") : pilaValores.pop();
                    ValItem der = pilaValores.isEmpty() ? new ValItem(null, null, "") : pilaValores.pop();
                    String convertido = extraido + izq.converted() + der.converted();

                    TokenNode startNode = izq.startNode() != null ? izq.startNode() : der.startNode();
                    TokenNode endNode = der.endNode() != null ? der.endNode() : izq.endNode();

                    boolean consumeParens = (pila.isEmpty() || pila.get(pila.size() - 1).equals(")"));
                    if (consumeParens && startNode != null && endNode != null &&
                        startNode.prev != null && startNode.prev.text.equals("(") &&
                        endNode.next != null && endNode.next.text.equals(")")) {
                        startNode = startNode.prev;
                        endNode = endNode.next;
                    }

                    TokenNode newNode = new TokenNode(convertido, "operand");
                    if (startNode != null && endNode != null) {
                        tokenList.replaceRange(startNode, endNode, newNode);
                    }
                    pilaValores.push(new ValItem(newNode, newNode, convertido));

                    numeroPaso++;
                    String expresionCompleta = tokenList.format();
                    PasoNotacionPolacaDto paso = new PasoNotacionPolacaDto(
                        numeroPaso, extraido, izq.converted() + " " + extraido + " " + der.converted(), convertido, expresionCompleta
                    );
                    pasos.add(paso);
                    fotogramas.add(new FotogramaNotacionPolacaDto("step", extraido, new ArrayList<>(pila), paso));
                }
                if (!pila.isEmpty() && pila.get(pila.size() - 1).equals(")")) {
                    pila.remove(pila.size() - 1);
                    if (!pilaOpItems.isEmpty()) pilaOpItems.pop();
                    fotogramas.add(new FotogramaNotacionPolacaDto("pop", ")", new ArrayList<>(pila), null));
                }
            } else if (currToken.type.equals("operand")) {
                epre.append(simb);
                pilaValores.push(new ValItem(currToken, currToken, simb));
            } else {
                // Es un operador
                if (!pila.isEmpty()) {
                    while (!pila.isEmpty() && prioridad(simb) < prioridad(pila.get(pila.size() - 1))) {
                        String extraido = pila.remove(pila.size() - 1);
                        pilaOpItems.pop();
                        fotogramas.add(new FotogramaNotacionPolacaDto("pop", extraido, new ArrayList<>(pila), null));
                        epre.append(extraido);

                        ValItem izq = pilaValores.isEmpty() ? new ValItem(null, null, "") : pilaValores.pop();
                        ValItem der = pilaValores.isEmpty() ? new ValItem(null, null, "") : pilaValores.pop();
                        String convertido = extraido + izq.converted() + der.converted();

                        TokenNode startNode = izq.startNode() != null ? izq.startNode() : der.startNode();
                        TokenNode endNode = der.endNode() != null ? der.endNode() : izq.endNode();

                        TokenNode newNode = new TokenNode(convertido, "operand");
                        if (startNode != null && endNode != null) {
                            tokenList.replaceRange(startNode, endNode, newNode);
                        }
                        pilaValores.push(new ValItem(newNode, newNode, convertido));

                        numeroPaso++;
                        String expresionCompleta = tokenList.format();
                        PasoNotacionPolacaDto paso = new PasoNotacionPolacaDto(
                            numeroPaso, extraido, izq.converted() + " " + extraido + " " + der.converted(), convertido, expresionCompleta
                        );
                        pasos.add(paso);
                        fotogramas.add(new FotogramaNotacionPolacaDto("step", extraido, new ArrayList<>(pila), paso));

                        if (pila.isEmpty()) break;
                    }
                }
                pila.add(simb);
                pilaOpItems.push(new OpItem(simb, currToken));
                fotogramas.add(new FotogramaNotacionPolacaDto("push", simb, new ArrayList<>(pila), null));
            }

            currToken = prevToken;
        }

        while (!pila.isEmpty()) {
            String extraido = pila.remove(pila.size() - 1);
            if (!pilaOpItems.isEmpty()) pilaOpItems.pop();
            fotogramas.add(new FotogramaNotacionPolacaDto("pop", extraido, new ArrayList<>(pila), null));
            if (!extraido.equals("(") && !extraido.equals(")")) {
                epre.append(extraido);

                ValItem izq = pilaValores.isEmpty() ? new ValItem(null, null, "") : pilaValores.pop();
                ValItem der = pilaValores.isEmpty() ? new ValItem(null, null, "") : pilaValores.pop();
                String convertido = extraido + izq.converted() + der.converted();

                TokenNode startNode = izq.startNode() != null ? izq.startNode() : der.startNode();
                TokenNode endNode = der.endNode() != null ? der.endNode() : izq.endNode();

                TokenNode newNode = new TokenNode(convertido, "operand");
                if (startNode != null && endNode != null) {
                    tokenList.replaceRange(startNode, endNode, newNode);
                }
                pilaValores.push(new ValItem(newNode, newNode, convertido));

                numeroPaso++;
                String expresionCompleta = tokenList.format();
                PasoNotacionPolacaDto paso = new PasoNotacionPolacaDto(
                    numeroPaso, extraido, izq.converted() + " " + extraido + " " + der.converted(), convertido, expresionCompleta
                );
                pasos.add(paso);
                fotogramas.add(new FotogramaNotacionPolacaDto("step", extraido, new ArrayList<>(pila), paso));
            }
        }

        return epre.reverse().toString();
    }
}
