package uni.AEDLab1.services;

/**
 * Servicio que maneja la interacción de las piezas de reinas dentro del tablero de ajedrez,
 * procesadas dentro de un arreglo estático que simula a la estructura Set.
 * 
 * @author samxdev7
 * @version 1.0
 */
public class OchoReinasService {
    private final int SIZE = 8;
    private final int X = 0;
    private final int Y = 1;
    
    private int[][] queens;
    private int i = -1;
    
    public OchoReinasService() {
        this.queens = new int[SIZE][2];
    }
    
    public int[][] getQueens() { return this.queens; }
    
    public boolean addQueen(int x, int y) {
        if (checkNonRepeatedQueen(i, x, y)) return false;
        
        this.queens[++i][X] = x;
        this.queens[i][Y] = y;
        return true;
    }
    
    public boolean moveQueen(int currX, int currY, int newX, int newY) {
        if (checkNonRepeatedQueen(i, newX, newY)) return false;
        
        int pos = getQueenPos(i, currX, currY);
        
        this.queens[pos][X] = newX;
        this.queens[pos][Y] = newY;
        return true;
    }
    
    
    private boolean checkNonRepeatedQueen(int j, int x, int y) {
        if (j < 0) return false;
        if ((this.queens[j][X] == x) && (this.queens[j][Y] == y))
            return true;
        
        return checkNonRepeatedQueen(j - 1, x, y);
    }
    
    private int getQueenPos(int j, int x, int y) {
        if (j < 0) return -1;
        if ((this.queens[j][X] == x) && (this.queens[j][Y] == y)) {
            return j;
        }
        
        return getQueenPos(j - 1, x, y);
    }
    
    public boolean resetQueenRegister() {
        i = -1;
        queens = new int[SIZE][2];
        return true;
    }
    
    public boolean executeVerification() {
        int k = 0, j = 0;
        
        if (i < SIZE - 1) return false;
        return verify(k, j);
    }
    
    private boolean verify(int i, int j) {
        if ((i >= SIZE - 1) && (j >= SIZE - 1)) return true;
        if (i == j) return verify(i, ++j);
        
        if (isThreating(queens[i][X], queens[i][Y], queens[j][X], queens[j][Y])) {
            return false;
        }
        
        if (j >= SIZE - 1) return verify(++i, (j = 0));
        return verify(i, ++j);
    }
    
    private boolean isThreating(int x1, int y1, int x2, int y2) {
        return (x1 == x2) && (y1 == y2) && (Math.abs(x2 - x1) == Math.abs(y2 - y1));
    }
}
