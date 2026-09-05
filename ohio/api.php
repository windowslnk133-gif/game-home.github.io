<?php
header('Content-Type: application/json; charset=utf-8');

$file = __DIR__ . '/leaderboard.json';

// 若檔案不存在，初始化空陣列
if (!file_exists($file)) {
    file_put_contents($file, json_encode([], JSON_PRETTY_PRINT));
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // 取得排行榜
    $data = file_get_contents($file);
    echo $data ? $data : json_encode([]);
    exit;
}

if ($method === 'POST') {
    // 寫入新紀錄
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (isset($input['n']) && isset($input['t'])) {
        $name = htmlspecialchars(trim($input['n']), ENT_QUOTES, 'UTF-8');
        $time = floatval($input['t']);

        $list = json_decode(file_get_contents($file), true);
        if (!is_array($list)) $list = [];

        $list[] = ['n' => $name, 't' => $time];
        
        // 依時間排序（由快到慢）並只留前 5 名
        usort($list, function($a, $b) {
            return $a['t'] <=> $b['t'];
        });
        $list = array_slice($list, 0, 5);

        file_put_contents($file, json_encode($list, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode(['status' => 'success', 'data' => $list]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid parameters']);
    }
    exit;
}
?>
